import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime, money } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ReceiptText, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

const TONES: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CREDIT_PAID: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CREDIT_PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PARTIALLY_REFUNDED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  REFUNDED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400"
};

export default async function SalesPage() {
  const user = await requirePermission("sales.view");
  const sales = await db.sale.findMany({ include: { customer: true, user: true, payments: true, _count: { select: { items: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const canCreate = user.permissions.includes("sales.create");

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ventas</h1>
          </div>
          <p className="text-sm text-muted-foreground">Historial reciente de operaciones.</p>
        </div>

        {canCreate && (
          <Button asChild>
            <Link href="/sales/new">
              <ShoppingCart className="size-4" />
              Nueva venta
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Últimas ventas</CardTitle>
          <CardDescription>Últimas 100 operaciones registradas, incluidos fiados y anulaciones.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Código</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-6">Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sales.length ? sales.map(x => (
                  <TableRow key={x.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6 font-mono text-xs font-medium">{x.code}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{dateTime(x.createdAt)}</TableCell>
                    <TableCell className="max-w-52 truncate">{x.customer.legalName || `${x.customer.firstName ?? ""} ${x.customer.lastName ?? ""}`}</TableCell>
                    <TableCell className="text-muted-foreground">{x.user.name}</TableCell>
                    <TableCell className="text-right font-medium">{money(x.total.toString())}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className={TONES[x.status] ?? "font-normal"}>{x.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <div className="flex min-h-52 flex-col items-center justify-center text-center">
                        <ReceiptText className="mb-3 size-9 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Sin ventas registradas</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {canCreate ? "Registra la primera desde el punto de venta." : "Las operaciones aparecerán aquí."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
