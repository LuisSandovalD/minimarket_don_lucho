import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { ManualSaleForm } from "@/components/manual-sale-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  await requirePermission("sales.create");

  const customers = await db.customer.findMany({
    where: { active: true },
    select: { id: true, firstName: true, lastName: true, legalName: true },
    orderBy: { firstName: "asc" },
    take: 300
  });

  const list = customers.map(customer => ({
    id: customer.id,
    name: customer.legalName || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "Cliente"
  }));

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nueva venta</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Registra una venta manual con cliente, productos y método de pago.
          </p>
        </div>

        <Button variant="secondary" asChild className="w-fit shadow-sm">
          <Link href="/sales">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <ManualSaleForm customers={list} />
        </CardContent>
      </Card>
    </div>
  );
}