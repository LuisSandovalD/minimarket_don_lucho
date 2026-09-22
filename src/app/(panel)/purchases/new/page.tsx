import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PurchaseForm } from "@/components/purchase-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  await requirePermission("purchases.create");
  const suppliers = await db.supplier.findMany({ where: { active: true, deletedAt: null }, select: { id: true, legalName: true, tradeName: true }, orderBy: { legalName: "asc" }, take: 500 });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1"><div className="flex items-center gap-2"><ClipboardList className="size-5 text-muted-foreground"/><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nueva compra</h1></div><p className="text-sm text-muted-foreground">Registra ingreso de mercadería seleccionando productos con imagen.</p></div>
        <Button variant="secondary" asChild className="w-fit"><Link href="/purchases"><ArrowLeft className="size-4"/>Volver</Link></Button>
      </div>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Ingreso de mercadería</CardTitle><CardDescription>Busca y selecciona visualmente cada producto. Cada línea actualiza stock, costo promedio e inventario.</CardDescription></CardHeader><CardContent><PurchaseForm suppliers={suppliers.map(s=>({id:s.id,name:s.tradeName||s.legalName}))}/></CardContent></Card>
    </div>
  );
}
