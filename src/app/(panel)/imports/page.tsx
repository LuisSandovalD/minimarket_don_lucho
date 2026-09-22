import Link from "next/link";
import { Download, FileSpreadsheet } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { ImportProducts } from "@/components/import-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImportsPage() {
    await requirePermission("imports.view");

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="size-5 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Importar productos
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Carga un archivo Excel, relaciona las columnas y revisa los datos antes de importarlos.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-normal">
                        Excel
                    </Badge>

                    <Button asChild variant="secondary" className="shadow-sm">
                        <Link href="/api/imports/template">
                            <Download className="size-4" />
                            Descargar plantilla
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Importación de productos</CardTitle>
                    <CardDescription>
                        Selecciona el archivo, configura el mapeo de columnas y valida la información antes de continuar.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <ImportProducts />
                </CardContent>
            </Card>
        </div>
    );
}