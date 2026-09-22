"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { catalogConfig } from "@/modules/admin/config";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "./ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

type Row = Record<string, string | boolean | string[] | null> & { id: string };

export function CatalogManager({
    kind, rows, total, page, query, options, permissions, canCreate, canUpdate
}: {
    kind: string;
    rows: Row[];
    total: number;
    page: number;
    query: string;
    options: Record<string, { id: string; name: string }[]>;
    permissions: { id: string; key: string }[];
    canCreate: boolean;
    canUpdate: boolean;
}) {
    const config = catalogConfig[kind];
    const Icon = config.icon;
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [data, setData] = useState<Record<string, unknown>>({ active: true });
    const visibleFields = config.fields.filter(f => !["password", "textarea", "boolean"].includes(f.type ?? "text")).slice(0, 4);

    function create() {
        setData({ active: true, allowsDecimals: false, creditLimit: "0", type: "QUANTITY", permissionIds: [] });
        setOpen(true);
    }

    function edit(row: Row) {
        setData({ ...row, password: "" });
        setOpen(true);
    }

    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (pending) return;

        setPending(true);
        try {
            const res = await fetch(`/api/catalog/${kind}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: data.id, data })
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.message);

            toast.success("Cambios guardados correctamente.");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Icon className="size-5 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.title}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">{total} registros encontrados.</p>
                </div>

                {canCreate && (
                    <Button onClick={create} className="w-fit">
                        <Plus className="size-4" />
                        Nuevo
                    </Button>
                )}
            </div>

            <form className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" defaultValue={query} placeholder={`Buscar en ${config.title.toLowerCase()}...`} className="border-0 bg-card pl-9 shadow-sm" />
            </form>

            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    <ScrollArea className="w-full">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {visibleFields.map(field => <TableHead key={field.key} className={field === visibleFields[0] ? "pl-6" : ""}>{field.label}</TableHead>)}
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="w-28 pr-6 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {rows.length ? rows.map(row => (
                                    <TableRow key={row.id} className="hover:bg-muted/40">
                                        {visibleFields.map((field, index) => (
                                            <TableCell key={field.key} className={index === 0 ? "pl-6 font-medium" : ""}>
                                                <span className="line-clamp-2">{String(row[field.key] ?? "—")}</span>
                                            </TableCell>
                                        ))}

                                        <TableCell>
                                            <Badge variant="secondary" className={row.active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}>
                                                {row.active ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="pr-6 text-right">
                                            {canUpdate ? (
                                                <Button variant="ghost" size="sm" onClick={() => edit(row)}>
                                                    <Pencil className="size-4" />
                                                    Editar
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={visibleFields.length + 2}>
                                            <div className="flex min-h-52 flex-col items-center justify-center text-center">
                                                <Icon className="mb-3 size-9 text-muted-foreground/40" />
                                                <p className="text-sm font-medium">Sin registros</p>
                                                <p className="mt-1 text-xs text-muted-foreground">No se encontraron resultados para esta búsqueda.</p>
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

            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{total} registros · Página {page}</p>

                <div className="flex gap-2">
                    {page > 1 && (
                        <Button variant="secondary" size="sm" asChild>
                            <Link href={`?q=${encodeURIComponent(query)}&page=${page - 1}`}>
                                <ChevronLeft className="size-4" />
                                Anterior
                            </Link>
                        </Button>
                    )}

                    {page * 25 < total && (
                        <Button variant="secondary" size="sm" asChild>
                            <Link href={`?q=${encodeURIComponent(query)}&page=${page + 1}`}>
                                Siguiente
                                <ChevronRight className="size-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <Dialog open={open} onOpenChange={value => !pending && setOpen(value)}>
                <DialogContent className="max-h-[90vh] overflow-hidden border-0 shadow-xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="size-5 text-muted-foreground" />
                            {data.id ? "Editar" : "Nuevo"} · {config.title}
                        </DialogTitle>
                        <DialogDescription>Completa la información y revisa los datos antes de guardar.</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh] pr-3">
                        <form onSubmit={save} className="grid gap-5 pb-1 sm:grid-cols-2">
                            {config.fields.map(field => (
                                <div key={field.key} className={`space-y-2 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                                    <Label htmlFor={field.key}>
                                        {field.label}
                                        {field.required && <span className="ml-1 text-destructive">*</span>}
                                    </Label>

                                    {field.type === "boolean" ? (
                                        <div className="flex min-h-10 items-center justify-between rounded-lg bg-muted/40 px-3">
                                            <span className="text-sm text-muted-foreground">{Boolean(data[field.key]) ? "Activo" : "Inactivo"}</span>
                                            <Switch id={field.key} checked={Boolean(data[field.key])} onCheckedChange={value => setData({ ...data, [field.key]: value })} />
                                        </div>
                                    ) : field.type === "textarea" ? (
                                        <Textarea id={field.key} value={String(data[field.key] ?? "")} onChange={e => setData({ ...data, [field.key]: e.target.value })} className="min-h-24 border-0 bg-muted/40 shadow-sm" />
                                    ) : field.type === "select" ? (
                                        <Select value={String(data[field.key] || "none")} onValueChange={value => setData({ ...data, [field.key]: value === "none" ? "" : value })}>
                                            <SelectTrigger id={field.key} className="w-full border-0 bg-muted/40 shadow-sm">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Seleccionar</SelectItem>
                                                {(field.options?.map(value => ({ id: value, name: value })) ?? options[field.key] ?? []).map(option => (
                                                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id={field.key}
                                            type={field.type ?? "text"}
                                            min={field.type === "number" ? 0 : undefined}
                                            step={field.type === "number" ? "0.01" : undefined}
                                            required={field.required}
                                            autoComplete={field.type === "password" ? "new-password" : "off"}
                                            value={String(data[field.key] ?? "")}
                                            onChange={e => setData({ ...data, [field.key]: e.target.value })}
                                            className="border-0 bg-muted/40 shadow-sm"
                                        />
                                    )}
                                </div>
                            ))}

                            {kind === "roles" && (
                                <div className="space-y-3 sm:col-span-2">
                                    <Label>Permisos</Label>

                                    <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl bg-muted/30 p-3 sm:grid-cols-2">
                                        {permissions.map(permission => {
                                            const selected = (data.permissionIds as string[] ?? []).includes(permission.id);

                                            return (
                                                <label key={permission.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                                                    <Checkbox
                                                        checked={selected}
                                                        onCheckedChange={checked => setData({
                                                            ...data,
                                                            permissionIds: checked
                                                                ? [...(data.permissionIds as string[] ?? []), permission.id]
                                                                : (data.permissionIds as string[] ?? []).filter(id => id !== permission.id)
                                                        })}
                                                    />
                                                    <span className="break-all">{permission.key}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <Button disabled={pending} className="sm:col-span-2">
                                {pending && <Loader2 className="size-4 animate-spin" />}
                                {pending ? "Guardando..." : "Confirmar y guardar"}
                            </Button>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}