import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Database, MonitorCog, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
    await requirePermission("audit.view");

    const rows = await db.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 200
    });

    const initials = (name?: string | null) =>
        name?.split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "S";

    return (
        <TooltipProvider>
            <div className="w-full space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-5 text-muted-foreground" />
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Auditoría</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Registro inmutable de acciones sensibles realizadas dentro del sistema.</p>
                    </div>

                    <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-normal">
                        {rows.length} registros recientes
                    </Badge>
                </div>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="size-4 text-muted-foreground" />
                                Actividad del sistema
                            </CardTitle>
                            <CardDescription>Últimos 200 eventos registrados por usuarios y procesos internos.</CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <ScrollArea className="w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="min-w-40 pl-6">Fecha</TableHead>
                                        <TableHead className="min-w-52">Usuario</TableHead>
                                        <TableHead>Módulo</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead className="min-w-48">Recurso</TableHead>
                                        <TableHead className="min-w-32 pr-6">IP</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {rows.length ? rows.map(row => (
                                        <TableRow key={row.id} className="border-0 hover:bg-muted/40">
                                            <TableCell className="pl-6 text-sm text-muted-foreground">
                                                {row.createdAt.toLocaleString("es-PE")}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-8 shadow-sm">
                                                        <AvatarFallback className="text-xs font-semibold">
                                                            {initials(row.user?.name)}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">{row.user?.name || "Sistema"}</p>
                                                        <p className="text-xs text-muted-foreground">{row.user ? "Usuario" : "Proceso interno"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {row.module}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MonitorCog className="size-4 text-muted-foreground" />
                                                    {row.action}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex max-w-72 cursor-default items-center gap-2">
                                                            <Database className="size-4 shrink-0 text-muted-foreground" />
                                                            <span className="truncate text-sm">{row.resource}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{row.resource}</TooltipContent>
                                                </Tooltip>
                                            </TableCell>

                                            <TableCell className="pr-6 font-mono text-xs text-muted-foreground">
                                                {row.ip || "—"}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={6}>
                                                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                                                    <ShieldCheck className="mb-3 size-9 text-muted-foreground/40" />
                                                    <p className="text-sm font-medium">Sin registros de auditoría</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">Las acciones sensibles aparecerán aquí cuando sean registradas.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}