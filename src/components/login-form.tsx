"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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