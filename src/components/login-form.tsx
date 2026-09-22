"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
<<<<<<< HEAD

export function LoginForm() {
    const [state, action, pending] = useActionState(loginAction, null);

    return <form action={action} className="mx-auto w-full max-w-sm space-y-5">
        <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingresa tus credenciales para continuar.</p>
        </div>

        <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="correo@ejemplo.com" required />
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">¿La olvidaste?</Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </div>

        {state && !state.success && <p role="alert" className="text-center text-sm text-destructive">{state.message}</p>}

        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</Button>
    </form>;
}
=======
export function LoginForm() { const [state, action, pending] = useActionState(loginAction, null); return <form action={action} className="w-full max-w-sm space-y-5"><div><h2 className="text-2xl font-semibold">Iniciar sesión</h2><p className="mt-1 text-sm text-[var(--muted)]">Ingresa tus credenciales para continuar.</p></div><div className="space-y-2"><Label htmlFor="email">Correo</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><div className="flex justify-between"><Label htmlFor="password">Contraseña</Label><Link className="text-sm text-[var(--primary)] hover:underline" href="/forgot-password">¿La olvidaste?</Link></div><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>{state && !state.success && <p role="alert" className="text-sm text-[var(--danger)]">{state.message}</p>}<Button className="w-full" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</Button></form>; }
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
