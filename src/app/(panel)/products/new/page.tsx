import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";
export const dynamic="force-dynamic";
export default async function NewProductPage(){await requirePermission("products.create");const[units,categories,brands]=await Promise.all([db.unitOfMeasure.findMany({where:{active:true},orderBy:{name:"asc"}}),db.productCategory.findMany({where:{active:true,deletedAt:null},orderBy:{name:"asc"},select:{id:true,name:true}}),db.brand.findMany({where:{active:true,deletedAt:null},orderBy:{name:"asc"},select:{id:true,name:true}})]);return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-semibold">Nuevo producto</h1><p className="text-sm text-[var(--muted)]">Registra precios, unidad y stock inicial.</p></div><div className="rounded-xl bg-[var(--card)] p-6 shadow-sm"><ProductForm units={units} categories={categories} brands={brands}/></div></div>}
