import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Pos } from "@/components/pos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanBarcode, TriangleAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PosPage() {
    await requirePermission("sales.create");

    const [general, customers] = await Promise.all([
        db.customer.findFirst({ where: { general: true } }),
        db.customer.findMany({
            where: { active: true },
            select: { id: true, firstName: true, lastName: true, legalName: true, general: true },
            orderBy: { firstName: "asc" },
            take: 300
        })
    ]);

    if (!general) return (
        <Alert className="border-0 shadow-sm">
            <TriangleAlert className="size-4" />
            <AlertTitle>Cliente general no encontrado</AlertTitle>
            <AlertDescription>Ejecuta el seed del proyecto para crear el registro CLIENTE GENERAL antes de utilizar el punto de venta.</AlertDescription>
        </Alert>
    );

    const list = customers.map(c => ({
        id: c.id,
        name: c.legalName || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Cliente",
        general: c.general
    }));

    if (!list.some(c => c.id === general.id)) {
        list.unshift({ id: general.id, name: "CLIENTE GENERAL", general: true });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <ScanBarcode className="size-5 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Punto de venta</h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Registra ventas con lector USB, cámara, pagos mixtos y ventas al crédito.</p>
                </div>

                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">
                    {list.length} clientes disponibles
                </Badge>
            </div>

            <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4 lg:p-5">
                    <Pos customerId={general.id} customers={list} />
                </CardContent>
            </Card>
        </div>
    );
}