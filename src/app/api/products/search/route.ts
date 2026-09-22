import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
<<<<<<< HEAD

/** Búsqueda exacta por SKU/código/QR primero (ideal para lector y cámara), luego texto. */
export async function GET(request: Request) {
  await requirePermission("products.view");
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  if (!q) {
    // Sin texto: devuelve lista general para seleccionar (paginada por fecha)
    const all = await db.product.findMany({ where: { active: true, deletedAt: null }, include: { unitOfMeasure: true }, take: limit, orderBy: { name: "asc" } });
    return NextResponse.json({ data: all.map(p => ({ id: p.id, sku: p.sku, name: p.name, price: p.salePrice.toString(), stock: p.stock.toString(), unit: p.unitOfMeasure.symbol })) });
  }
  // QR generado por el sistema guarda {"sku": "..."} -> extrae sku
  let code = q;
  if (q.startsWith("{")) { try { code = (JSON.parse(q) as { sku?: string }).sku ?? q; } catch { /* usa q tal cual */ } }
  const exact = await db.product.findMany({
    where: { active: true, deletedAt: null, OR: [{ sku: { equals: code, mode: "insensitive" } }, { qrCode: code }, { barcodes: { some: { code } } }] },
    include: { unitOfMeasure: true }, take: 5, orderBy: { name: "asc" }
  });
  const products = exact.length ? exact : await db.product.findMany({
    where: { active: true, deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { barcodes: { some: { code: { contains: q } } } }] },
    include: { unitOfMeasure: true }, take: limit, orderBy: { name: "asc" }
  });
  return NextResponse.json({ data: products.map(p => ({ id: p.id, sku: p.sku, name: p.name, price: p.salePrice.toString(), stock: p.stock.toString(), unit: p.unitOfMeasure.symbol })) });
}
=======
export async function GET(request:Request){await requirePermission("products.view");const q=new URL(request.url).searchParams.get("q")?.trim()??"";if(!q)return NextResponse.json({data:[]});const products=await db.product.findMany({where:{active:true,deletedAt:null,OR:[{sku:{equals:q,mode:"insensitive"}},{barcodes:{some:{code:q}}},{name:{contains:q,mode:"insensitive"}}]},include:{unitOfMeasure:true},take:20,orderBy:{name:"asc"}});return NextResponse.json({data:products.map(p=>({id:p.id,sku:p.sku,name:p.name,price:p.salePrice.toString(),stock:p.stock.toString(),allowsDecimals:p.allowsDecimals,unit:p.unitOfMeasure.symbol}))});}
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
