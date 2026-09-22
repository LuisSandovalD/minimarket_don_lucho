<<<<<<< HEAD
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requirePermission("products.create");

  const [units, categories, brands] = await Promise.all([
    db.unitOfMeasure.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.productCategory.findMany({ where: { active: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ where: { active: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PackagePlus className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo producto</h1>
          </div>
          <p className="text-sm text-muted-foreground">Registra precios, unidad, categoría y stock inicial.</p>
        </div>

        <Button variant="secondary" asChild className="w-fit">
          <Link href="/products"><ArrowLeft className="size-4" />Volver</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Información del producto</CardTitle>
          <CardDescription>El SKU y código QR se generan automáticamente si no los indicas.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm units={units} categories={categories} brands={brands} />
        </CardContent>
      </Card>
    </div>
  );
}
=======
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";
export const dynamic="force-dynamic";
export default async function NewProductPage(){await requirePermission("products.create");const[units,categories,brands]=await Promise.all([db.unitOfMeasure.findMany({where:{active:true},orderBy:{name:"asc"}}),db.productCategory.findMany({where:{active:true,deletedAt:null},orderBy:{name:"asc"},select:{id:true,name:true}}),db.brand.findMany({where:{active:true,deletedAt:null},orderBy:{name:"asc"},select:{id:true,name:true}})]);return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-semibold">Nuevo producto</h1><p className="text-sm text-[var(--muted)]">Registra precios, unidad y stock inicial.</p></div><div className="rounded-xl bg-[var(--card)] p-6 shadow-sm"><ProductForm units={units} categories={categories} brands={brands}/></div></div>}
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
