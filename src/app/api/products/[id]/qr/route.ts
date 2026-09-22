import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) { await requirePermission("products.view"); const { id } = await context.params; const p = await db.product.findUniqueOrThrow({ where: { id } }); const png = await QRCode.toBuffer(JSON.stringify({ sku: p.sku, id: p.id }), { type: "png", width: 600, margin: 2 }); return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "content-disposition": `inline; filename=${p.sku}-qr.png` } }); }
