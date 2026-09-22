import bwipjs from "bwip-js";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { await requirePermission("products.view"); const { id } = await context.params; const p = await db.product.findUniqueOrThrow({ where: { id }, include: { barcodes: { where: { primary: true }, take: 1 } } }); const code = p.barcodes[0]?.code ?? p.sku; const type = new URL(request.url).searchParams.get("type") ?? "code128"; const png = await bwipjs.toBuffer({ bcid: ["ean13","ean8","upca","code128"].includes(type) ? type : "code128", text: code, scale: 3, height: 12, includetext: true }); return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "content-disposition": `inline; filename=${p.sku}-barcode.png` } }); }
