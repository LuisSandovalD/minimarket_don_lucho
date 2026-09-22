"use client";
import { useActionState } from "react";
import { verifyEmail } from "@/modules/auth/verification";
import { Button } from "./ui/button";
export function VerifyForm({ token }: { token: string }) { const [state, action, pending] = useActionState(verifyEmail, null); return <form action={action} className="space-y-4"><h1 className="text-xl">Verificar correo</h1><input name="token" type="hidden" value={token}/><Button disabled={pending || state?.success}>{pending ? "Verificando…" : "Confirmar verificación"}</Button>{state && <p role="status">{state.success ? "Correo verificado." : state.message}</p>}</form>; }
