import { QrCode } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { LabelPrinter } from "@/components/label-printer";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  await requirePermission("products.view");

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Etiquetas QR / barras</h1>
          </div>
          <p className="text-sm text-muted-foreground">Selecciona productos, define copias y genera un PDF listo para imprimir.</p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">QR · Código de barras</Badge>
      </div>

      <LabelPrinter />
    </div>
  );
}