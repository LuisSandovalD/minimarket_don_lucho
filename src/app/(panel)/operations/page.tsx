import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OperationForm } from "@/components/operation-form";
import { operationPermissions } from "@/modules/operations/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await requireUser();
  const kinds = Object.entries(operationPermissions).filter(([, p]) => actor.permissions.includes(p)).map(([k]) => k);
  const products = kinds.some(k => ["purchase", "adjustment"].includes(k)) ? await db.product.findMany({ where: { active: true }, select: { id: true, name: true }, take: 500 }) : [];
  const suppliers = kinds.includes("purchase") ? await db.supplier.findMany({ where: { active: true }, select: { id: true, legalName: true }, take: 500 }) : [];
  const customers = kinds.includes("credit-payment") ? await db.customer.findMany({ where: { general: false, credit: { balance: { gt: 0 } } }, select: { id: true, firstName: true, lastName: true, legalName: true }, take: 500 }) : [];
  const categories = kinds.includes("expense") ? await db.expenseCategory.findMany({ where: { active: true }, select: { id: true, name: true } }) : [];
  const sales = kinds.includes("cancel-sale") ? await db.sale.findMany({ where: { status: { in: ["COMPLETED", "CREDIT_PENDING", "CREDIT_PAID"] } }, select: { id: true, code: true }, orderBy: { createdAt: "desc" }, take: 100 }) : [];
  const items = kinds.includes("refund") ? await db.saleItem.findMany({ where: { sale: { status: { notIn: ["CANCELLED", "REFUNDED"] } } }, include: { product: { select: { name: true } }, sale: { select: { code: true } } }, orderBy: { sale: { createdAt: "desc" } }, take: 200 }) : [];

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Wrench className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Operaciones</h1>
        </div>
        <p className="text-sm text-muted-foreground">Compra, gasto, abono, ajuste de inventario, anulación y devoluciones en un solo lugar.</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Registrar operación</CardTitle>
          <CardDescription>Cada operación valida permisos, actualiza saldos y queda registrada en auditoría.</CardDescription>
        </CardHeader>

        <CardContent>
          <OperationForm kinds={kinds} options={{ productId: products, supplierId: suppliers.map(s => ({ id: s.id, name: s.legalName })), customerId: customers.map(c => ({ id: c.id, name: c.legalName || `${c.firstName ?? ""} ${c.lastName ?? ""}` })), categoryId: categories, saleId: sales.map(s => ({ id: s.id, name: s.code })), saleItemId: items.map(i => ({ id: i.id, name: `${i.sale.code} · ${i.product.name}` })) }} />
        </CardContent>
      </Card>
    </div>
  );
}
