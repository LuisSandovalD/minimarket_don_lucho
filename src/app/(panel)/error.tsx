"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <Card className="w-full max-w-md border-0 shadow-sm">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                        <TriangleAlert className="size-5" />
                    </div>

                    <h1 className="text-lg font-semibold">No se pudo cargar este módulo</h1>
                    <p className="text-sm text-muted-foreground">Verifica tu sesión, tus permisos y la conexión con la base de datos.</p>

                    <Button variant="outline" className="mt-2" onClick={reset}>
                        <RotateCcw className="size-4" />
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
