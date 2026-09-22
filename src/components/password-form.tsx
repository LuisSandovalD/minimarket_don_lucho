"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, MailCheck, Save } from "lucide-react";
import { changePassword } from "@/modules/auth/profile";
import { requestVerification } from "@/modules/auth/verification";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export function PasswordForm() {
    const [state, action, pending] = useActionState(changePassword, null);
    const [verifying, setVerifying] = useState(false);

    async function verify() {
        if (verifying) return;
        setVerifying(true);
        try {
            const result = await requestVerification();
            result.success ? toast.success("Enlace de verificación enviado.") : toast.error(result.message);
        } finally { setVerifying(false); }
    }

    return <div className="w-full max-w-lg space-y-6">
        <form action={action} className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-background shadow-sm"><KeyRound className="size-5 text-muted-foreground" /></div>
                <div><p className="text-sm font-medium">Cambiar contraseña</p><p className="text-xs text-muted-foreground">Al cambiarla se cerrarán las sesiones activas.</p></div>
            </div>

            <div className="space-y-2"><Label htmlFor="current">Contraseña actual</Label><Input id="current" name="current" type="password" required autoComplete="current-password" disabled={pending} className="border-0 bg-muted/40 shadow-sm" /></div>
            <div className="space-y-2"><Label htmlFor="password">Nueva contraseña</Label><Input id="password" name="password" type="password" minLength={12} required autoComplete="new-password" disabled={pending} className="border-0 bg-muted/40 shadow-sm" /><p className="text-xs text-muted-foreground">Debe tener al menos 12 caracteres.</p></div>

            {state && <p role="status" className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>{state.success ? "Contraseña cambiada. Inicia sesión nuevamente." : state.message}</p>}

            <Button disabled={pending} size="lg">{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "Guardando..." : "Cambiar contraseña"}</Button>
        </form>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
            <div><p className="text-sm font-medium">Verificación de correo</p><p className="text-xs text-muted-foreground">Envía un nuevo enlace de verificación a tu correo.</p></div>
            <Button type="button" variant="secondary" disabled={verifying} onClick={() => void verify()}>{verifying ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}{verifying ? "Enviando..." : "Enviar enlace"}</Button>
        </div>
    </div>;
}