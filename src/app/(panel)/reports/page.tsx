import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartNoAxesCombined, CircleDollarSign, ReceiptText, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requirePermission("reports.sales");
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const [sales, costs, expenses] = await Promise.all([
    db.sale.aggregate({ where: { createdAt: { gte: start }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
    db.saleItem.aggregate({ where: { sale: { createdAt: { gte: start }, status: { not: "CANCELLED" } } }, _sum: { subtotal: true } }),
    db.expense.aggregate({ where: { createdAt: { gte: start }, status: "ACTIVE" }, _sum: { amount: true } })
  ]);

  const month = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(start);

  const stats = [
    { label: "Ventas", value: money(sales._sum.total?.toString() ?? 0), icon: CircleDollarSign, description: "Total facturado del mes" },
    { label: "Operaciones", value: sales._count.toString(), icon: ReceiptText, description: "Ventas no anuladas" },
    { label: "Gastos", value: money(expenses._sum.amount?.toString() ?? 0), icon: Wallet, description: "Egresos activos del mes" }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reportes</h1>
          </div>
          <p className="text-sm text-muted-foreground">Resumen del mes actual.</p>
        </div>

        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal capitalize">
          {month}
        </Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>

                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground">
        Los reportes se calculan en vivo desde la base de datos; no contienen valores simulados. Suma de líneas vendidas: {money(costs._sum.subtotal?.toString() ?? 0)}.
      </p>
    </div>
  );
}
