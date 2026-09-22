import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { ContactRound, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("customers.view");
  const { q = "" } = await searchParams;
  const customers = await db.customer.findMany({
    where: {
      active: true, deletedAt: null,
      ...(q ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { legalName: { contains: q, mode: "insensitive" } },
          { dni: { contains: q } }, { ruc: { contains: q } }
        ]
      } : {})
    },
    include: { credit: true },
    orderBy: [{ general: "desc" }, { firstName: "asc" }]
  });

  return <div className="w-full space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1"><div className="flex items-center gap-2"><ContactRound className="size-5 text-muted-foreground" /><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clientes y fiados</h1></div><p className="text-sm text-muted-foreground">Cuenta corriente, límites de crédito y saldos pendientes.</p></div>
      <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">{customers.length} clientes</Badge>
    </div>

    <form className="relative max-w-xl">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" defaultValue={q} placeholder="Buscar por nombre, DNI o RUC..." className="border-0 bg-card pl-9 shadow-sm" />
    </form>

    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-6">Cliente</TableHead><TableHead>Documento</TableHead><TableHead className="text-right">Límite</TableHead><TableHead className="pr-6 text-right">Deuda</TableHead></TableRow></TableHeader>
            <TableBody>
              {customers.length ? customers.map(x => {
                const name = x.legalName || `${x.firstName ?? ""} ${x.lastName ?? ""}`.trim() || "Cliente";
                const debt = Number(x.credit?.balance?.toString() ?? 0);
                return <TableRow key={x.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6"><div className="flex items-center gap-2"><span className="font-medium">{name}</span>{x.general && <Badge variant="secondary" className="text-[10px]">General</Badge>}</div></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{x.dni || x.ruc || "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{money(x.creditLimit.toString())}</TableCell>
                  <TableCell className="pr-6 text-right"><span className={debt > 0 ? "font-semibold text-destructive" : "font-medium text-muted-foreground"}>{money(debt)}</span></TableCell>
                </TableRow>;
              }) : <TableRow className="hover:bg-transparent"><TableCell colSpan={4}><div className="flex min-h-52 flex-col items-center justify-center text-center"><ContactRound className="mb-3 size-9 text-muted-foreground/40" /><p className="text-sm font-medium">Sin clientes encontrados</p><p className="mt-1 text-xs text-muted-foreground">Ajusta la búsqueda o registra un nuevo cliente.</p></div></TableCell></TableRow>}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  </div>;
}