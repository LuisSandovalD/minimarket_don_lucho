import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OperationForm } from "@/components/operation-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { dateTime, money } from "@/lib/utils";
import { PAYMENT_LABELS } from "@/lib/payment-methods";
import { CircleDollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const actor = await requireUser();
  const categories = await db.expenseCategory.findMany({ where: { active: true }, select: { id: true, name: true } });
  const expenses = await db.expense.findMany({ include: { category: true, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const canCreate = actor.permissions.includes("expenses.create");

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Gastos</h1>
          </div>
          <p className="text-sm text-muted-foreground">Registra y consulta egresos de caja.</p>
        </div>

        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">
          Últimos {expenses.length} registros
        </Badge>
      </div>

      {canCreate && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Registrar gasto</CardTitle>
            <CardDescription>Descuenta el monto de la caja abierta y queda registrado en auditoría.</CardDescription>
          </CardHeader>
          <CardContent>
            <OperationForm kinds={["expense"]} options={{ categoryId: categories }} />
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Historial de gastos</CardTitle>
          <CardDescription>Egresos activos registrados por los usuarios.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="pr-6">Usuario</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {expenses.length ? expenses.map(e => (
                  <TableRow key={e.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6 whitespace-nowrap text-muted-foreground">{dateTime(e.createdAt)}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-normal">{e.category.name}</Badge></TableCell>
                    <TableCell className="max-w-72 truncate">{e.description}</TableCell>
                    <TableCell className="text-muted-foreground">{PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod}</TableCell>
                    <TableCell className="text-right font-medium">{money(Number(e.amount))}</TableCell>
                    <TableCell className="pr-6 text-muted-foreground">{e.user.name}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <div className="flex min-h-52 flex-col items-center justify-center text-center">
                        <CircleDollarSign className="mb-3 size-9 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Sin gastos registrados</p>
                        <p className="mt-1 text-xs text-muted-foreground">Los egresos aparecerán aquí cuando se registren.</p>
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
