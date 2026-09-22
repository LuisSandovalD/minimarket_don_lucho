<<<<<<< HEAD
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { SettingsForm } from "@/components/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Settings2, ShieldCheck } from "lucide-react";

export default async function Page() {
    const actor = await requirePermission("settings.view");
    const settings = await db.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });
    const values = Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, String(value ?? "")]));
    const editable = actor.permissions.includes("settings.update");

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Settings2 className="size-5 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Configuración del negocio</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">Administra la información general, ventas, inventario y preferencias del minimarket.</p>
                </div>

                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">
                    {editable ? "Edición habilitada" : "Solo lectura"}
                </Badge>
            </div>

            <Card className="w-full border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Información general</CardTitle>
                    <CardDescription>
                        {editable ? "Modifica los parámetros utilizados por el sistema." : "Puedes consultar la configuración, pero no modificarla."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <SettingsForm values={values} editable={editable} />
                </CardContent>
            </Card>

            <Alert className="border-0 bg-muted/40 shadow-sm">
                <ShieldCheck className="size-4" />
                <AlertTitle>Configuración protegida</AlertTitle>
                <AlertDescription>
                    Las credenciales de Brevo y Cloudinary se administran únicamente mediante variables de entorno del servidor.
                </AlertDescription>
            </Alert>
        </div>
    );
}
=======
import{db}from"@/lib/db";import{requirePermission}from"@/lib/auth";
export const dynamic="force-dynamic";export default async function SettingsPage(){await requirePermission("settings.view");const s=await db.businessSettings.upsert({where:{id:"singleton"},create:{},update:{}});return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Configuración</h1><p className="text-sm text-[var(--muted)]">Parámetros vigentes del negocio.</p></div><dl className="grid gap-4 rounded-xl bg-[var(--card)] p-6 shadow-sm sm:grid-cols-2">{[["Nombre",s.businessName],["RUC",s.ruc||"Sin configurar"],["Moneda",s.currency],["Prefijo SKU",s.skuPrefix],["Prefijo ventas",s.salePrefix],["IGV",`${s.taxRate}%`],["Alerta de vencimiento",`${s.expirationAlertDays} días`],["Ticket",`${s.ticketWidth} mm`]].map(([k,v])=><div key={k}><dt className="text-sm text-[var(--muted)]">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl></div>}
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
