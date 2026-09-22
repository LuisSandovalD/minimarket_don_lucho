"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction } from "@/modules/auth/actions";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export function RecoveryForm({ token }: { token?: string }) {
  const [state, action, pending] = useActionState(token ? resetPasswordAction : forgotPasswordAction, null);

  return <form action={action} className="mx-auto flex w-full max-w-sm flex-col items-center space-y-5 text-center">
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">{token ? <KeyRound className="size-5" /> : <Mail className="size-5" />}</div>
      <h1 className="text-2xl font-semibold tracking-tight">{token ? "Nueva contraseña" : "Recuperar contraseña"}</h1>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{token ? "Crea una nueva contraseña segura para tu cuenta." : "Ingresa tu correo y te enviaremos las instrucciones para recuperar el acceso."}</p>
    </div>

    {token ? <>
      <input type="hidden" name="token" value={token} />
      <div className="w-full space-y-2 text-center">
        <Label htmlFor="password" className="justify-center">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" placeholder="••••••••••••" className="text-center" required />
        <p className="text-xs leading-5 text-muted-foreground">Mínimo 12 caracteres e incluye mayúscula, minúscula, número y símbolo.</p>
      </div>
    </> : <div className="w-full space-y-2 text-center">
      <Label htmlFor="email" className="justify-center">Correo</Label>
      <Input id="email" name="email" type="email" autoComplete="email" placeholder="correo@ejemplo.com" className="text-center" required />
    </div>}

    {state && <p role="status" className={`w-full rounded-lg px-3 py-2 text-center text-sm ${state.success ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive"}`}>{state.success ? token ? "Contraseña actualizada. Ya puedes iniciar sesión nuevamente." : "Si el correo está registrado, recibirás las instrucciones." : state.message}</p>}

    <Button type="submit" className="w-full" disabled={pending}>{pending ? "Procesando…" : token ? "Actualizar contraseña" : "Enviar instrucciones"}</Button>

    <Link href="/login" className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="size-4" />
      Volver al inicio de sesión
    </Link>
  </form>;
}