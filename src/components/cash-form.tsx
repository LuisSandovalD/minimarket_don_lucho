"use client";
<<<<<<< HEAD

import { useActionState, useState } from "react";
import { closeCashAction, openCashAction } from "@/modules/cash/actions";
import { Loader2, LockKeyhole, UnlockKeyhole, WalletCards } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function CashForm({ registers, session }: { registers: { id: string; name: string }[]; session?: { id: string; openingAmount: string } | null }) {
    const [state, action, pending] = useActionState(session ? closeCashAction : openCashAction, null);
    const [registerId, setRegisterId] = useState(registers[0]?.id ?? "");

    return <form action={action} className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
            <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm"><WalletCards className="size-5 text-muted-foreground" /></div>
                <div><p className="text-sm font-medium">{session ? "Caja abierta" : "Apertura de caja"}</p><p className="text-xs text-muted-foreground">{session ? "Registra el efectivo contado para cerrar la caja." : "Selecciona la caja e ingresa el monto inicial."}</p></div>
            </div>
            <Badge variant="secondary" className={session ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : ""}>{session ? "Abierta" : "Cerrada"}</Badge>
        </div>

        {session ? <>
            <input type="hidden" name="sessionId" value={session.id} />
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Monto inicial</Label><div className="rounded-xl bg-muted/40 px-4 py-3"><p className="text-2xl font-semibold tracking-tight">S/ {session.openingAmount}</p><p className="text-xs text-muted-foreground">Monto registrado al abrir caja</p></div></div>
                <div className="space-y-2"><Label htmlFor="countedAmount">Efectivo contado</Label><Input id="countedAmount" name="countedAmount" type="number" min="0" step="0.01" placeholder="0.00" required disabled={pending} className="border-0 bg-muted/40 shadow-sm" /></div>
            </div>
        </> : <>
            <input type="hidden" name="cashRegisterId" value={registerId} />
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="cashRegisterId">Caja</Label><Select value={registerId || undefined} onValueChange={setRegisterId} disabled={pending}><SelectTrigger id="cashRegisterId" className="w-full border-0 bg-muted/40 shadow-sm"><SelectValue placeholder="Seleccionar caja" /></SelectTrigger><SelectContent>{registers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="openingAmount">Monto inicial</Label><Input id="openingAmount" name="openingAmount" type="number" min="0" step="0.01" placeholder="0.00" required disabled={pending} className="border-0 bg-muted/40 shadow-sm" /></div>
            </div>
        </>}

        {state && !state.success && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}

        <Button type="submit" size="lg" disabled={pending || (!session && !registerId)} variant={session ? "destructive" : "default"} className="w-full sm:w-auto">
            {pending ? <Loader2 className="size-4 animate-spin" /> : session ? <LockKeyhole className="size-4" /> : <UnlockKeyhole className="size-4" />}
            {pending ? "Procesando..." : session ? "Cerrar caja" : "Abrir caja"}
        </Button>
    </form>;
}
=======
import { useActionState } from "react";
import { closeCashAction, openCashAction } from "@/modules/cash/actions";
import { Button } from "./ui/button";import{Input}from"./ui/input";import{Label}from"./ui/label";
export function CashForm({registers,session}:{registers:{id:string;name:string}[];session?:{id:string;openingAmount:string}|null}){const[actionState,action,pending]=useActionState(session?closeCashAction:openCashAction,null);return <form action={action} className="max-w-md space-y-4">{session?<><input type="hidden" name="sessionId" value={session.id}/><p className="text-sm text-[var(--muted)]">Monto inicial: S/ {session.openingAmount}</p><div className="space-y-2"><Label htmlFor="countedAmount">Efectivo contado</Label><Input id="countedAmount" name="countedAmount" type="number" min="0" step="0.01" required/></div></>:<><div className="space-y-2"><Label htmlFor="cashRegisterId">Caja</Label><select id="cashRegisterId" name="cashRegisterId" className="h-10 w-full rounded-lg bg-[var(--card)] px-3 ring-1 ring-[var(--border)]">{registers.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="openingAmount">Monto inicial</Label><Input id="openingAmount" name="openingAmount" type="number" min="0" step="0.01" required/></div></>}{actionState&&!actionState.success&&<p className="text-sm text-[var(--danger)]">{actionState.message}</p>}<Button disabled={pending} variant={session?"destructive":"default"}>{pending?"Procesando…":session?"Cerrar caja":"Abrir caja"}</Button></form>}
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
