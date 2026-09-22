import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime, money } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ClipboardList, PackagePlus } from "lucide-react";

export const dynamic = "force-dynamic";

const TONES: Record<string, string> = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DRAFT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400"
};

export default async function PurchasesPage() {
  const user = await requirePermission("purchases.view");
  const rows = await db.purchase.findMany({ include: { supplier: true, user: true }, orderBy: { purchasedAt: "desc" }, take: 100 });
  const canCreate = user.permissions.includes("purchases.create");

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Compras</h1>
          </div>
          <p className="text-sm text-muted-foreground">Ingresos de mercadería por proveedor.</p>
        </div>

        {canCreate && (
          <Button asChild>
            <Link href="/purchases/new">
              <PackagePlus className="size-4" />
              Nueva compra
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Últimas compras</CardTitle>
          <CardDescription>Últimos 100 ingresos de mercadería registrados.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Código</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-6">Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length ? rows.map(x => (
                  <TableRow key={x.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6 font-mono text-xs font-medium">{x.code}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{dateTime(x.purchasedAt)}</TableCell>
                    <TableCell>{x.supplier.tradeName || x.supplier.legalName}</TableCell>
                    <TableCell className="text-right font-medium">{money(x.total.toString())}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className={TONES[x.status] ?? "font-normal"}>{x.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5}>
                      <div className="flex min-h-52 flex-col items-center justify-center text-center">
                        <ClipboardList className="mb-3 size-9 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Sin compras registradas</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {canCreate ? "Usa «Nueva compra» para registrar el primer ingreso." : "Los ingresos aparecerán aquí cuando se registren."}
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
