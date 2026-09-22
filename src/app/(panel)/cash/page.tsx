<<<<<<< HEAD
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { CashForm } from "@/components/cash-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CashPage() {
    const user = await requirePermission("cash.view");
    const [registers, session] = await Promise.all([
        db.cashRegister.findMany({ where: { active: true } }),
        db.cashSession.findFirst({ where: { userId: user.id, status: "OPEN" } })
    ]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Banknote className="size-5 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Caja</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {session ? "Tu caja está abierta. Registra el cierre con el efectivo contado." : "Abre una caja antes de realizar ventas."}
                    </p>
                </div>

                <Badge variant={session ? "default" : "secondary"} className="w-fit rounded-full px-3 py-1 font-normal">
                    {session ? "Caja abierta" : "Caja cerrada"}
                </Badge>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">{session ? "Cerrar caja" : "Abrir caja"}</CardTitle>
                    <CardDescription>
                        {session ? "El cierre registra la diferencia entre lo contado y lo esperado." : "Selecciona la caja y declara el monto inicial en efectivo."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <CashForm registers={registers} session={session ? { id: session.id, openingAmount: session.openingAmount.toString() } : null} />
                </CardContent>
            </Card>
        </div>
    );
}
=======
import { requirePermission } from "@/lib/auth";import{db}from"@/lib/db";import{CashForm}from"@/components/cash-form";
export const dynamic="force-dynamic";
export default async function CashPage(){const user=await requirePermission("cash.view");const[registers,session]=await Promise.all([db.cashRegister.findMany({where:{active:true}}),db.cashSession.findFirst({where:{userId:user.id,status:"OPEN"}})]);return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Caja</h1><p className="text-sm text-[var(--muted)]">{session?"Tu caja está abierta.":"Abre una caja antes de realizar ventas."}</p></div><div className="rounded-xl bg-[var(--card)] p-6 shadow-sm"><CashForm registers={registers} session={session?{id:session.id,openingAmount:session.openingAmount.toString()}:null}/></div></div>}
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
