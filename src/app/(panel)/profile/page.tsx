import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/utils";
import { PasswordForm } from "@/components/password-form";
import { revokeSession } from "@/modules/auth/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await requireUser();
  const sessions = await db.session.findMany({ where: { userId: actor.id, expiresAt: { gt: new Date() } }, select: { id: true, createdAt: true, userAgent: true, ip: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Perfil y seguridad</h1>
        </div>
        <p className="text-sm text-muted-foreground">{actor.name} · {actor.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Contraseña</CardTitle>
            <CardDescription>Cambiarla cerrará todas las sesiones activas de tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sesiones activas</CardTitle>
            <CardDescription>Dispositivos con sesión iniciada en los últimos 7 días.</CardDescription>
          </CardHeader>

          <CardContent>
            {sessions.length ? (
              <ul className="divide-y divide-border/60">
                {sessions.map(s => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium">{dateTime(s.createdAt)}{s.ip ? ` · ${s.ip}` : ""}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.userAgent || "Agente desconocido"}</p>
                    </div>

                    <form action={revokeSession}>
                      <input type="hidden" name="sessionId" value={s.id} />
                      <Button variant="outline" size="sm">Cerrar sesión</Button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <UserRound className="mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">Sin sesiones activas</p>
                <p className="mt-1 text-xs text-muted-foreground">Las sesiones aparecerán aquí cuando inicies sesión.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
