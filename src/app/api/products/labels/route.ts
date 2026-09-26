import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

type Mode = "qr" | "barcode" | "both";
type LabelItem = { name: string; price: string; sku: string; code: string };

function fitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const suffix = "...";
  let value = text;
  while (value.length && font.widthOfTextAtSize(`${value}${suffix}`, size) > maxWidth) value = value.slice(0, -1);
  return `${value}${suffix}`;
}

export async function GET(request: Request) {
  await requirePermission("products.view");
  const params = new URL(request.url).searchParams;
  const mode: Mode = params.get("mode") === "qr" ? "qr" : params.get("mode") === "barcode" ? "barcode" : "both";
  const perPage = [12, 24, 40].includes(Number(params.get("perPage"))) ? Number(params.get("perPage")) : 24;
  const ids = (params.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 500);
  if (!ids.length) return NextResponse.json({ success: false, message: "Selecciona productos." }, { status: 400 });

  let copies: Record<string, number> = {};
  try { copies = JSON.parse(params.get("copies") ?? "{}"); } catch { copies = {}; }

  const products = await db.product.findMany({ where: { id: { in: ids }, active: true }, include: { barcodes: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const queue: LabelItem[] = [];

  for (const id of ids) {
    const p = byId.get(id);
    if (!p) continue;
    const amount = Math.min(200, Math.max(1, Number(copies[id]) || 1));
    const code = p.barcodes.find((b) => b.primary)?.code ?? p.barcodes[0]?.code ?? p.sku;
    for (let i = 0; i < amount; i++) queue.push({ name: p.name, price: p.salePrice.toString(), sku: p.sku, code });
  }

  if (!queue.length) return NextResponse.json({ success: false, message: "Sin productos válidos." }, { status: 404 });

  const items = queue.slice(0, 2000);
  const cols = perPage === 12 ? 3 : perPage === 24 ? 4 : 5;
  const rows = perPage === 12 ? 4 : perPage === 24 ? 6 : 8;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const PW = 595.28;
  const PH = 841.89;
  const margin = perPage === 40 ? 14 : 18;
  const gap = perPage === 40 ? 4 : 6;
  const cw = (PW - margin * 2 - gap * (cols - 1)) / cols;
  const ch = (PH - margin * 2 - gap * (rows - 1)) / rows;

  const style = perPage === 12
    ? { pad: 7, name: 9.5, price: 13, sku: 7.5, header: 48, footer: 10 }
    : perPage === 24
      ? { pad: 5.5, name: 8, price: 11, sku: 6.5, header: 41, footer: 8 }
      : { pad: 4, name: 6.5, price: 9, sku: 5.5, header: 34, footer: 6 };

  for (let pageIndex = 0; pageIndex < Math.ceil(items.length / perPage); pageIndex++) {
    const page = doc.addPage([PW, PH]);
    const current = items.slice(pageIndex * perPage, pageIndex * perPage + perPage);

    for (let i = 0; i < current.length; i++) {
      const item = current[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cw + gap);
      const y = PH - margin - (row + 1) * ch - row * gap;
      const pad = style.pad;
      const contentX = x + pad;
      const contentW = cw - pad * 2;
      const contentBottom = y + pad;
      const contentTop = y + ch - pad;
      const headerBottom = contentTop - style.header;
      const codeTop = headerBottom - 2;
      const codeBottom = contentBottom + style.footer;
      const codeH = Math.max(10, codeTop - codeBottom);

      page.drawRectangle({ x, y, width: cw, height: ch, color: rgb(1, 1, 1), borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.6 });

      const name = fitText(item.name.trim(), bold, style.name, contentW);
      page.drawText(name, { x: contentX, y: contentTop - style.name, size: style.name, font: bold, color: rgb(0.08, 0.08, 0.08) });

      const priceText = `S/ ${Number(item.price).toFixed(2)}`;
      page.drawText(priceText, { x: contentX, y: contentTop - style.name - style.price - 5, size: style.price, font: bold, color: rgb(0.03, 0.03, 0.03) });

      const sku = fitText(item.sku, font, style.sku, contentW);
      page.drawText(sku, { x: contentX, y: headerBottom + 4, size: style.sku, font, color: rgb(0.42, 0.42, 0.42) });
      page.drawLine({ start: { x: contentX, y: headerBottom }, end: { x: contentX + contentW, y: headerBottom }, thickness: 0.45, color: rgb(0.9, 0.9, 0.9) });

      try {
        if (mode === "qr") {
          const qrBuffer = await QRCode.toBuffer(JSON.stringify({ sku: item.sku }), { width: 260, margin: 0, errorCorrectionLevel: "M" });
          const qr = await doc.embedPng(qrBuffer);
          const side = Math.min(contentW, codeH) * 0.88;
          page.drawImage(qr, { x: contentX + (contentW - side) / 2, y: codeBottom + (codeH - side) / 2, width: side, height: side });
        }

        if (mode === "barcode") {
          const buffer = await bwipjs.toBuffer({ bcid: "code128", text: item.code.slice(0, 40), scale: 3, height: 10, includetext: false });
          const barcode = await doc.embedPng(buffer);
          const maxW = contentW * 0.94;
          const maxH = codeH * 0.64;
          const ratio = barcode.width / barcode.height;
          let w = maxW;
          let h = w / ratio;
          if (h > maxH) { h = maxH; w = h * ratio; }

          page.drawImage(barcode, { x: contentX + (contentW - w) / 2, y: codeBottom + codeH - h - 3, width: w, height: h });

          const codeText = fitText(item.code, font, style.sku, contentW);
          const textWidth = font.widthOfTextAtSize(codeText, style.sku);
          page.drawText(codeText, { x: contentX + (contentW - textWidth) / 2, y: codeBottom + 2, size: style.sku, font, color: rgb(0.25, 0.25, 0.25) });
        }

        if (mode === "both") {
          const qrBuffer = await QRCode.toBuffer(JSON.stringify({ sku: item.sku }), { width: 240, margin: 0, errorCorrectionLevel: "M" });
          const qr = await doc.embedPng(qrBuffer);
          const barcodeBuffer = await bwipjs.toBuffer({ bcid: "code128", text: item.code.slice(0, 40), scale: 3, height: 9, includetext: false });
          const barcode = await doc.embedPng(barcodeBuffer);

          const qrAreaW = contentW * 0.36;
          const barcodeAreaX = contentX + qrAreaW + 4;
          const barcodeAreaW = contentW - qrAreaW - 4;
          const qrSide = Math.min(qrAreaW, codeH) * 0.9;

          page.drawImage(qr, { x: contentX + (qrAreaW - qrSide) / 2, y: codeBottom + (codeH - qrSide) / 2, width: qrSide, height: qrSide });

          const maxBarcodeH = codeH * 0.5;
          const ratio = barcode.width / barcode.height;
          let barcodeW = barcodeAreaW * 0.96;
          let barcodeH = barcodeW / ratio;
          if (barcodeH > maxBarcodeH) { barcodeH = maxBarcodeH; barcodeW = barcodeH * ratio; }

          page.drawImage(barcode, { x: barcodeAreaX + (barcodeAreaW - barcodeW) / 2, y: codeBottom + codeH - barcodeH - 4, width: barcodeW, height: barcodeH });

          const codeText = fitText(item.code, font, style.sku, barcodeAreaW);
          const textWidth = font.widthOfTextAtSize(codeText, style.sku);
          page.drawText(codeText, { x: barcodeAreaX + (barcodeAreaW - textWidth) / 2, y: codeBottom + 3, size: style.sku, font, color: rgb(0.25, 0.25, 0.25) });
        }
      } catch {
        const fallback = fitText(item.code, font, style.sku, contentW);
        page.drawText(fallback, { x: contentX, y: codeBottom + codeH / 2, size: style.sku, font, color: rgb(0.35, 0.35, 0.35) });
      }
    }

    page.drawText(`Minimarket Don Lucho · Página ${pageIndex + 1}`, { x: margin, y: 6, size: 6, font, color: rgb(0.58, 0.58, 0.58) });
  }

  const bytes = await doc.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="etiquetas_don_lucho.pdf"', "cache-control": "no-store" } });
}