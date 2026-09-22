import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Boxes } from "lucide-react";

export const dynamic = "force-dynamic";

const TONES: Record<string, string> = {
  PURCHASE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  RETURN: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  INITIAL_STOCK: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  IMPORT: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  LOSS: "bg-red-500/10 text-red-700 dark:text-red-400",
  DAMAGE: "bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRATION: "bg-red-500/10 text-red-700 dark:text-red-400",
  INTERNAL_USE: "bg-red-500/10 text-red-700 dark:text-red-400"
};

export default async function InventoryPage() {
  await requirePermission("inventory.view");

  const movements = await db.inventoryMovement.findMany({
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Boxes className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Inventario y Kardex
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Últimos 100 movimientos registrados.
          </p>
        </div>

        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">
          {movements.length} movimientos
        </Badge>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="pr-6">Usuario</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {movements.length ? (
                  movements.map((x) => (
                    <TableRow key={x.id} className="hover:bg-muted/40">
                      <TableCell className="pl-6 whitespace-nowrap text-muted-foreground">
                        {dateTime(x.createdAt)}
                      </TableCell>

                      <TableCell className="max-w-64 truncate font-medium">
                        {x.product.name}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={TONES[x.type] ?? "font-normal"}
                        >
                          {x.type}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {x.quantity.toString()}
                      </TableCell>

                      <TableCell className="text-right text-muted-foreground">
                        {x.resultingStock.toString()}
                      </TableCell>

                      <TableCell className="pr-6 text-muted-foreground">
                        {x.user.name}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <div className="flex min-h-52 flex-col items-center justify-center text-center">
                        <Boxes className="mb-3 size-9 text-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          Sin movimientos de inventario
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Los ingresos, ventas y ajustes aparecerán aquí.
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