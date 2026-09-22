import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { money } from "@/lib/utils";
<<<<<<< HEAD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, Boxes, CircleDollarSign, CreditCard, ReceiptText, ShoppingCart, TrendingUp, WalletCards } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const user = await requirePermission("dashboard.view");
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [sales, payments, lowStock, debts, expenses] = await Promise.all([
        db.sale.aggregate({
            where: { createdAt: { gte: start }, status: { not: "CANCELLED" } },
            _sum: { total: true },
            _count: true
        }),
        db.salePayment.groupBy({
            by: ["method"],
            where: { sale: { createdAt: { gte: start }, status: { not: "CANCELLED" } } },
            _sum: { amount: true }
        }),
        db.product.count({
            where: { active: true, deletedAt: null, stock: { lte: db.product.fields.minimumStock } }
        }),
        db.customerCredit.aggregate({ _sum: { balance: true } }),
        db.expense.aggregate({
            where: { createdAt: { gte: start }, status: "ACTIVE" },
            _sum: { amount: true }
        })
    ]);

    const canProfit = user.permissions.includes("reports.profit");
    const salesTotal = Number(sales._sum.total ?? 0);
    const expenseTotal = Number(expenses._sum.amount ?? 0);
    const debtTotal = Number(debts._sum.balance ?? 0);
    const result = salesTotal - expenseTotal;

    const stats = [
        { label: "Ventas de hoy", value: money(salesTotal), icon: CircleDollarSign, description: "Ingresos registrados" },
        { label: "Operaciones", value: sales._count.toString(), icon: ShoppingCart, description: "Ventas completadas" },
        { label: "Deuda pendiente", value: money(debtTotal), icon: WalletCards, description: "Créditos por cobrar" },
        { label: "Stock bajo", value: lowStock.toString(), icon: Boxes, description: lowStock ? "Productos por reponer" : "Inventario estable" }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Panel general</p>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Resumen de hoy</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Estado actual de las operaciones del minimarket.</p>
                </div>

                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">
                    Actualizado en tiempo real
                </Badge>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ label, value, icon: Icon, description }) => (
                    <Card key={label} className="border-0 shadow-sm transition-shadow hover:shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">{label}</p>
                                    <p className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                                </div>
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                                    <Icon className="size-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="size-4 text-muted-foreground" />
                                    Métodos de pago
                                </CardTitle>
                                <CardDescription>Distribución de los cobros realizados hoy.</CardDescription>
                            </div>
                            <Badge variant="outline" className="border-0 bg-muted font-normal">
                                {payments.length} {payments.length === 1 ? "método" : "métodos"}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {payments.length ? (
                            <div className="space-y-2">
                                {payments.map(row => (
                                    <div key={row.method} className="flex items-center justify-between rounded-xl bg-muted/45 px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-background shadow-sm">
                                                <Banknote className="size-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{row.method}</p>
                                                <p className="text-xs text-muted-foreground">Monto recaudado</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold">{money(row._sum.amount?.toString() ?? 0)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-44 flex-col items-center justify-center rounded-xl bg-muted/35 px-6 text-center">
                                <ReceiptText className="mb-3 size-8 text-muted-foreground/60" />
                                <p className="text-sm font-medium">Aún no hay ventas registradas</p>
                                <p className="mt-1 text-xs text-muted-foreground">Los métodos de pago aparecerán cuando se registren operaciones.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="size-4 text-muted-foreground" />
                            Control operativo
                        </CardTitle>
                        <CardDescription>Indicadores financieros básicos del día.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <div className="rounded-xl bg-muted/45 p-4">
                            <p className="text-xs text-muted-foreground">Ventas acumuladas</p>
                            <p className="mt-1 text-xl font-semibold">{money(salesTotal)}</p>
                        </div>

                        <div className="rounded-xl bg-muted/45 p-4">
                            <p className="text-xs text-muted-foreground">Gastos de hoy</p>
                            <p className="mt-1 text-xl font-semibold">{money(expenseTotal)}</p>
                        </div>

                        {canProfit && (
                            <div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm">
                                <p className="text-xs opacity-75">Resultado antes de costo</p>
                                <p className="mt-1 text-xl font-semibold">{money(result)}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
=======
export const dynamic = "force-dynamic";
export default async function DashboardPage() { const user = await requirePermission("dashboard.view"); const start = new Date(); start.setHours(0,0,0,0); const [sales, payments, lowStock, debts, expenses] = await Promise.all([db.sale.aggregate({ where: { createdAt: { gte: start }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),db.salePayment.groupBy({ by: ["method"], where: { sale: { createdAt: { gte: start }, status: { not: "CANCELLED" } } }, _sum: { amount: true } }),db.product.count({ where: { active: true, deletedAt: null, stock: { lte: db.product.fields.minimumStock } } }),db.customerCredit.aggregate({ _sum: { balance: true } }),db.expense.aggregate({ where: { createdAt: { gte: start }, status: "ACTIVE" }, _sum: { amount: true } })]); const canProfit = user.permissions.includes("reports.profit"); return <div className="space-y-7"><div><h1 className="text-2xl font-semibold">Resumen de hoy</h1><p className="text-sm text-[var(--muted)]">Información real de la operación del minimarket.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Ventas",money(sales._sum.total?.toString() ?? 0)],["Operaciones",String(sales._count)],["Deuda pendiente",money(debts._sum.balance?.toString() ?? 0)],["Stock bajo",String(lowStock)]].map(([label,value]) => <div key={label} className="rounded-xl bg-[var(--card)] p-5 shadow-sm"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</section><section className="grid gap-5 lg:grid-cols-2"><div className="rounded-xl bg-[var(--card)] p-5 shadow-sm"><h2 className="font-semibold">Métodos de pago de hoy</h2><div className="mt-4 space-y-3">{payments.length ? payments.map(row => <div key={row.method} className="flex justify-between text-sm"><span>{row.method}</span><strong>{money(row._sum.amount?.toString() ?? 0)}</strong></div>) : <p className="text-sm text-[var(--muted)]">Aún no hay ventas registradas.</p>}</div></div><div className="rounded-xl bg-[var(--card)] p-5 shadow-sm"><h2 className="font-semibold">Control operativo</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Gastos de hoy</span><strong>{money(expenses._sum.amount?.toString() ?? 0)}</strong></div>{canProfit && <div className="flex justify-between"><span>Resultado antes de costo</span><strong>{money(Number(sales._sum.total ?? 0)-Number(expenses._sum.amount ?? 0))}</strong></div>}</div></div></section></div>; }
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
