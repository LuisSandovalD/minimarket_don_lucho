import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
export async function GET(request: Request) {
  try {
    await requirePermission("products.export"); const params = new URL(request.url).searchParams; const format = params.get("format") ?? "xlsx"; if (!["xlsx", "csv"].includes(format)) throw new AppError("FORMAT", "Formato no permitido."); const q = (params.get("q") ?? "").slice(0,100);
    const where = { active: true, deletedAt: null, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { sku: { contains: q, mode: "insensitive" as const } }] } : {}) };
    const products = await db.product.findMany({ where, include: { category: true, brand: true, unitOfMeasure: true, barcodes: true, defaultSupplier: true }, orderBy: { name: "asc" }, take: 10000 });
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("PRODUCTOS"); sheet.columns = ["sku","codigo_barras","nombre","descripcion","categoria","marca","unidad","precio_compra","precio_venta","precio_mayorista","stock","stock_minimo","proveedor","activo"].map(header => ({ header, key: header, width: 22 }));
    for (const p of products) sheet.addRow({ sku: p.sku, codigo_barras: p.barcodes.find(b => b.primary)?.code ?? p.barcodes[0]?.code ?? "", nombre: p.name, descripcion: p.description ?? "", categoria: p.category?.name ?? "", marca: p.brand?.name ?? "", unidad: p.unitOfMeasure.symbol, precio_compra: p.purchasePrice.toString(), precio_venta: p.salePrice.toString(), precio_mayorista: p.wholesalePrice?.toString() ?? "", stock: p.stock.toString(), stock_minimo: p.minimumStock.toString(), proveedor: p.defaultSupplier?.legalName ?? "", activo: p.active ? "Sí" : "No" });
    sheet.getRow(1).font = { bold: true }; const buffer = format === "csv" ? await workbook.csv.writeBuffer() : await workbook.xlsx.writeBuffer(); return new NextResponse(Buffer.from(buffer), { headers: { "content-type": format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename=productos_don_lucho.${format}` } });
  } catch (error) { return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo exportar." }, { status: 403 }); }
}
