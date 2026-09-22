import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

/** PDF de etiquetas para pegar en productos: nombre, precio, SKU + QR/barras. */
export async function GET(request: Request) {
  await requirePermission("products.view");
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode") === "qr" ? "qr" : params.get("mode") === "barcode" ? "barcode" : "both";
  const perPage = [12, 24, 40].includes(Number(params.get("perPage"))) ? Number(params.get("perPage")) : 24;
  const ids = (params.get("ids") ?? "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 500);
  if (!ids.length) return NextResponse.json({ success: false, message: "Selecciona productos." }, { status: 400 });
  let copies: Record<string, number> = {};
  try { copies = JSON.parse(params.get("copies") ?? "{}"); } catch { copies = {}; }

  const products = await db.product.findMany({ where: { id: { in: ids }, active: true }, include: { barcodes: true } });
  const byId = new Map(products.map(p => [p.id, p]));
  const queue: { name: string; price: string; sku: string; code: string }[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) continue;
    const n = Math.min(200, Math.max(1, Number(copies[id]) || 1));
    const code = p.barcodes.find(b => b.primary)?.code ?? p.barcodes[0]?.code ?? p.sku;
    for (let i = 0; i < n; i++) queue.push({ name: p.name, price: p.salePrice.toString(), sku: p.sku, code });
  }
  if (!queue.length) return NextResponse.json({ success: false, message: "Sin productos válidos." }, { status: 404 });
  // Límite de seguridad: 2000 etiquetas por PDF
  const items = queue.slice(0, 2000);

  const cols = perPage === 12 ? 3 : perPage === 24 ? 4 : 5;
  const rows = Math.ceil(perPage / cols);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const PW = 595.28, PH = 841.89; // A4
  const margin = 24, gap = 8;
  const cw = (PW - margin * 2 - gap * (cols - 1)) / cols;
  const ch = (PH - margin * 2 - gap * (rows - 1)) / rows;

  for (let page = 0; page < Math.ceil(items.length / perPage); page++) {
    const pdf = doc.addPage([PW, PH]);
    const slice = items.slice(page * perPage, page * perPage + perPage);
    for (let i = 0; i < slice.length; i++) {
      const it = slice[i];
      const c = i % cols, r = Math.floor(i / cols);
      const x = margin + c * (cw + gap), y = PH - margin - (r + 1) * ch - r * gap + gap * 0;
      pdf.drawRectangle({ x, y, width: cw, height: ch, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.75 });
      const px = x + 6, pw = cw - 12;
      pdf.drawText(it.name.slice(0, 32), { x: px, y: y + ch - 16, size: 8.5, font: bold, maxWidth: pw });
      pdf.drawText(`S/ ${Number(it.price).toFixed(2)}`, { x: px, y: y + ch - 30, size: 11, font: bold });
      pdf.drawText(it.sku.slice(0, 24), { x: px, y: y + ch - 41, size: 7, font, color: rgb(0.35, 0.35, 0.35) });
      const imgY = y + 6, imgH = ch - 52;
      try {
        if (mode !== "barcode") {
          const qr = await QRCode.toBuffer(JSON.stringify({ sku: it.sku }), { width: 220, margin: 1 });
          const img = await doc.embedPng(qr);
          const side = mode === "both" ? Math.min(pw / 2 - 2, imgH) : Math.min(pw, imgH);
          pdf.drawImage(img, { x: mode === "both" ? px : px + (pw - side) / 2, y: imgY, width: side, height: side });
        }
        if (mode !== "qr") {
          const png = await bwipjs.toBuffer({ bcid: "code128", text: it.code.slice(0, 40), scale: 2, height: 8, includetext: true });
          const img = await doc.embedPng(png);
          if (mode === "both") {
            const w = pw / 2 - 2, h = Math.min(imgH, 44);
            pdf.drawImage(img, { x: px + pw / 2 + 2, y: imgY + 4, width: w, height: h });
          } else {
            const w = pw, h = Math.min(imgH, 52);
            pdf.drawImage(img, { x: px, y: imgY + 4, width: w, height: h });
          }
        }
      } catch { pdf.drawText(it.code.slice(0, 30), { x: px, y: imgY + 10, size: 7, font }); }
    }
    pdf.drawText(`Minimarket Don Lucho - pag ${page + 1}`, { x: margin, y: 12, size: 7, font, color: rgb(0.5, 0.5, 0.5) });
  }
  const bytes = await doc.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": "attachment; filename=etiquetas_don_lucho.pdf" } });
}
