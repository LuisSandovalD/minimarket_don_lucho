import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { dateTime, money } from "@/lib/utils";
import { escapeHtml } from "@/lib/security";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await requirePermission("sales.view");
  const { id } = await context.params;
  const sale = await db.sale.findUniqueOrThrow({ where: { id }, include: { items: { include: { product: true } }, payments: true, customer: true, user: true } });
  const settings = await db.businessSettings.findUnique({ where: { id: "singleton" } });
  const width = settings?.ticketWidth ?? 80;
  const customer = sale.customer.legalName ?? `${sale.customer.firstName ?? ""} ${sale.customer.lastName ?? ""}`.trim();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(sale.code)}</title><style>@page{size:${width}mm auto;margin:0}body{font-family:monospace;width:${width-8}mm;margin:4mm;font-size:11px}h2{text-align:center;font-size:15px}.row{display:flex;justify-content:space-between}.line{border-top:1px dashed #333;margin:6px 0}</style></head><body><h2>${escapeHtml(settings?.businessName ?? "MINIMARKET DON LUCHO")}</h2><div>Venta: ${escapeHtml(sale.code)}</div><div>Fecha: ${escapeHtml(dateTime(sale.createdAt))}</div><div>Cajero: ${escapeHtml(sale.user.name)}</div><div>Cliente: ${escapeHtml(customer)}</div><div class="line"></div>${sale.items.map(i => `<div>${escapeHtml(i.product.name)}<div class="row"><span>${escapeHtml(i.quantity.toString())} x ${escapeHtml(money(i.unitPrice.toString()))}</span><span>${escapeHtml(money(i.subtotal.toString()))}</span></div></div>`).join("")}<div class="line"></div><div class="row"><b>TOTAL</b><b>${escapeHtml(money(sale.total.toString()))}</b></div>${sale.payments.map(p => `<div class="row"><span>${escapeHtml(p.method)}</span><span>${escapeHtml(money(p.amount.toString()))}</span></div>`).join("")}<p style="text-align:center">Gracias por su compra</p><script>window.print()</script></body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'", "x-content-type-options": "nosniff" } });
}
