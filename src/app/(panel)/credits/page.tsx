import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OperationForm } from "@/components/operation-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { money } from "@/lib/utils";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const actor = await requireUser();
  const customers = await db.customer.findMany({ where: { general: false }, include: { credit: true }, orderBy: { updatedAt: "desc" }, take: 200 });
  const canPay = actor.permissions.includes("credits.receive_payment");
  const debtors = customers.filter(c => Number(c.credit?.balance ?? 0) > 0);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fiados y créditos</h1>
          </div>
          <p className="text-sm text-muted-foreground">Saldos y abonos de clientes.</p>
        </div>

        <Badge variant={debtors.length ? "secondary" : "outline"} className="w-fit rounded-full border-0 bg-muted px-3 py-1 font-normal">
          {debtors.length} con deuda pendiente
        </Badge>
      </div>

      {canPay && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Registrar abono</CardTitle>
            <CardDescription>Descuenta el monto del saldo pendiente del cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <OperationForm kinds={["credit-payment"]} options={{ customerId: debtors.map(c => ({ id: c.id, name: c.legalName || `${c.firstName ?? ""} ${c.lastName ?? ""}` })) }} />
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Saldos de clientes</CardTitle>
          <CardDescription>Últimos 200 clientes con movimiento de crédito.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Deuda</TableHead>
                  <TableHead className="text-right">Límite</TableHead>
                  <TableHead className="pr-6">Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {customers.length ? customers.map(c => {
                  const debt = Number(c.credit?.balance ?? 0);
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell className="pl-6 font-medium">{c.legalName || `${c.firstName ?? ""} ${c.lastName ?? ""}`}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{money(debt)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{money(Number(c.creditLimit))}</TableCell>
                      <TableCell className="pr-6">
                        <Badge variant="secondary" className={debt > 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}>
                          {debt > 0 ? "Pendiente" : "Al día"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5}>
                      <div className="flex min-h-52 flex-col items-center justify-center text-center">
                        <Wallet className="mb-3 size-9 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Sin clientes con crédito</p>
                        <p className="mt-1 text-xs text-muted-foreground">Los saldos aparecerán aquí cuando se registren fiados.</p>
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
