import { FileSpreadsheet } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { ImportProducts } from "@/components/import-products";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImportsPage() {
  await requirePermission("imports.view");
  return <div className="w-full space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1"><div className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-muted-foreground"/><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Importaciones</h1></div><p className="text-sm text-muted-foreground">Carga información masiva desde Excel o CSV sin registrar datos uno por uno.</p></div>
      <div className="flex flex-wrap gap-2"><Badge variant="secondary" className="rounded-full px-3 py-1 font-normal">Excel / CSV</Badge><Badge variant="secondary" className="rounded-full px-3 py-1 font-normal">Hasta 5000 filas</Badge></div>
    </div>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Centro de importaciones</CardTitle><CardDescription>Selecciona qué deseas importar, descarga una plantilla opcional, sube tu archivo, relaciona columnas y revisa la vista previa antes de confirmar.</CardDescription></CardHeader><CardContent><ImportProducts/></CardContent></Card>
  </div>;
}
