"use client";

import { useActionState } from "react";
import { saveSettings } from "@/modules/settings/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader2, Save } from "lucide-react";

const fields = [
    ["businessName", "Nombre del negocio"],
    ["ruc", "RUC"],
    ["address", "Dirección"],
    ["phone", "Teléfono"],
    ["skuPrefix", "Prefijo SKU"],
    ["salePrefix", "Prefijo de ventas"],
    ["taxRate", "IGV (%)"],
    ["defaultMinimumStock", "Stock mínimo predeterminado"],
    ["expirationAlertDays", "Anticipación de vencimientos (días)"]
] as const;

export function SettingsForm({ values, editable }: { values: Record<string, string>; editable: boolean }) {
    const [state, action, pending] = useActionState(saveSettings, null);

    return (
        <form action={action} className="w-full space-y-8">
            <section className="grid w-full gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map(([key, label]) => (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Input
                            id={key}
                            name={key}
                            defaultValue={values[key]}
                            disabled={!editable || pending}
                            className="h-10 w-full bg-muted/30 shadow-sm"
                        />
                    </div>
                ))}

                <div className="space-y-2">
                    <Label htmlFor="ticketWidth">Ancho de ticket</Label>
                    <Select name="ticketWidth" defaultValue={values.ticketWidth} disabled={!editable || pending}>
                        <SelectTrigger id="ticketWidth" className="h-10 w-full bg-muted/30 shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="58">58 mm</SelectItem>
                            <SelectItem value="80">80 mm</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="requireDigitalReference">Referencia de pago digital</Label>
                    <Select name="requireDigitalReference" defaultValue={values.requireDigitalReference} disabled={!editable || pending}>
                        <SelectTrigger id="requireDigitalReference" className="h-10 w-full bg-muted/30 shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Obligatoria</SelectItem>
                            <SelectItem value="false">Opcional</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-5">
                    {state && (
                        <p role="status" className={`text-sm ${state.success ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                            {state.success ? "Configuración guardada correctamente." : state.message}
                        </p>
                    )}
                </div>

                {editable && (
                    <Button type="submit" disabled={pending} className="w-full shadow-sm sm:w-auto">
                        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {pending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                )}
            </div>
        </form>
    );
}