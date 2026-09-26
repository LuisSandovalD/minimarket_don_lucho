"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCheck, ChevronLeft, ChevronRight, FileDown, Keyboard, List, QrCode, Search, Trash2 } from "lucide-react";
import { CameraScanner } from "./camera-scanner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

type Row = { id: string; sku: string; name: string; price: string };
type Mode = "qr" | "barcode" | "both";
const PAGE_SIZE = 50;

export function LabelPrinter() {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<Record<string, number>>({});
    const [mode, setMode] = useState<Mode>("both");
    const [perPage, setPerPage] = useState(24);
    const [showAll, setShowAll] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [manual, setManual] = useState("");
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const visible = useMemo(() => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [rows, page]);
    const count = Object.keys(selected).length;
    const totalCopies = Object.values(selected).reduce((a, b) => a + b, 0);
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

    async function search(value: string) {
        setQ(value);
        setPage(0);
        if (value.trim().length >= 2) {
            try {
                const r = await fetch(`/api/products/search?q=${encodeURIComponent(value)}&limit=50`);
                if (!r.ok) throw new Error("No se pudieron buscar los productos.");
                const j = await r.json();
                setRows(j.data ?? []);
                setShowAll(false);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "No se pudo realizar la búsqueda.");
            }
            return;
        }
        if (!value.trim() && showAll) return;
        setRows([]);
    }

    async function loadAll() {
        setLoading(true);
        try {
            const r = await fetch(`/api/products/search?limit=${PAGE_SIZE}`);
            if (!r.ok) throw new Error("No se pudieron cargar los productos.");
            const j = await r.json();
            setRows(j.data ?? []);
            setShowAll(true);
            setPage(0);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo cargar.");
        } finally {
            setLoading(false);
        }
    }

    async function scanSelect(code: string) {
        const value = code.trim();
        if (!value) return;
        const r = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
        if (!r.ok) return toast.error("No se pudo buscar el producto.");
        const j = await r.json();
        const hit: Row | undefined = j.data?.[0];
        if (!hit) return toast.error("Producto no registrado", { description: `Código: ${value.slice(0, 40)}` });
        setSelected((s) => ({ ...s, [hit.id]: (s[hit.id] ?? 0) + 1 }));
        setRows((current) => current.some((x) => x.id === hit.id) ? current : [hit, ...current]);
        toast.success(`${hit.name} seleccionado`);
    }

    async function addManual() {
        if (!manual.trim()) return;
        await scanSelect(manual);
        setManual("");
    }

    function toggle(id: string) {
        setSelected((s) => {
            const next = { ...s };
            if (next[id]) delete next[id];
            else next[id] = 1;
            return next;
        });
    }

    function selectVisible() {
        setSelected((s) => {
            const next = { ...s };
            visible.forEach((r) => { next[r.id] ||= 1; });
            return next;
        });
    }

    function openPdf() {
        if (!count) return toast.error("Selecciona al menos un producto.");
        const params = new URLSearchParams({ ids: Object.keys(selected).join(","), mode, copies: JSON.stringify(selected), perPage: String(perPage) });
        window.open(`/api/products/labels?${params}`, "_blank");
    }

    return (
        <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]">
            <Card className="min-w-0 overflow-hidden border-0 shadow-sm">
                <CardHeader className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base"><Search className="size-4 shrink-0 text-muted-foreground" />Seleccionar productos</CardTitle>
                    <CardDescription>Busca por nombre, SKU, código de barras o utiliza la cámara.</CardDescription>
                </CardHeader>

                <CardContent className="min-w-0 space-y-5">
                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={q} onChange={(e) => void search(e.target.value)} placeholder="Nombre, SKU o código..." className="h-10 w-full min-w-0 border-0 bg-muted/40 pl-9 shadow-sm" />
                        </div>
                        <Button variant="secondary" className="w-full xl:w-auto" onClick={() => setShowCamera((v) => !v)}><Camera className="size-4" />{showCamera ? "Cerrar cámara" : "Cámara"}</Button>
                        <Button variant="secondary" className="w-full xl:w-auto" onClick={() => void loadAll()} disabled={loading}><List className="size-4" />{loading ? "Cargando..." : "Mostrar productos"}</Button>
                    </div>

                    {showCamera && <div className="min-w-0 overflow-hidden rounded-xl"><CameraScanner onScan={scanSelect} /></div>}

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                        <Input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addManual(); } }} placeholder="Escribe un código y pulsa Enter..." className="min-w-0 flex-1 border-0 bg-muted/40 shadow-sm" />
                        <Button variant="secondary" className="shrink-0" onClick={() => void addManual()}><Keyboard className="size-4" /><span>Agregar</span></Button>
                    </div>

                    {!!visible.length && (
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap gap-2">
                                <Button size="sm" variant="secondary" onClick={selectVisible}><CheckCheck className="size-4" />Seleccionar visibles</Button>
                                {!!count && <Button size="sm" variant="ghost" onClick={() => setSelected({})}><Trash2 className="size-4" />Limpiar</Button>}
                            </div>
                            <Badge variant="secondary" className="w-fit shrink-0">{count} seleccionados</Badge>
                        </div>
                    )}

                    <ScrollArea className="h-[min(520px,55vh)] w-full min-w-0">
                        <div className="min-w-0 space-y-2 pr-3">
                            {visible.map((row) => (
                                <div key={row.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/35 p-3 transition hover:bg-muted/55">
                                    <Checkbox checked={!!selected[row.id]} onCheckedChange={() => toggle(row.id)} className="shrink-0" />
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <p className="truncate text-sm font-medium" title={row.name}>{row.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{row.sku} · S/ {row.price}</p>
                                    </div>
                                    {!!selected[row.id] && <Input type="number" min={1} value={selected[row.id]} onChange={(e) => setSelected((s) => ({ ...s, [row.id]: Math.max(1, Number(e.target.value) || 1) }))} className="h-9 w-16 shrink-0 border-0 bg-background px-2 text-center shadow-sm sm:w-20" />}
                                </div>
                            ))}

                            {!visible.length && !loading && (q.trim().length >= 2 || showAll) && (
                                <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
                                    <Search className="mb-3 size-8 text-muted-foreground/40" />
                                    <p className="text-sm font-medium">No se encontraron productos</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Prueba con otro nombre, SKU o código.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {totalPages > 1 && (
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                            <Button variant="ghost" size="sm" disabled={!page} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /><span className="hidden sm:inline">Anterior</span></Button>
                            <span className="truncate text-center text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
                            <Button variant="ghost" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}><span className="hidden sm:inline">Siguiente</span><ChevronRight className="size-4" /></Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden border-0 shadow-sm 2xl:sticky 2xl:top-20 2xl:h-fit">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><QrCode className="size-4 shrink-0 text-muted-foreground" />Opciones de impresión</CardTitle>
                    <CardDescription>Configura el formato antes de generar el PDF.</CardDescription>
                </CardHeader>

                <CardContent className="min-w-0 space-y-5">
                    <div className="space-y-2">
                        <Label>Tipo de código</Label>
                        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                            <SelectTrigger className="w-full min-w-0 border-0 bg-muted/40 shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="both">QR + barras</SelectItem>
                                <SelectItem value="qr">Solo QR</SelectItem>
                                <SelectItem value="barcode">Solo barras</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Etiquetas por página</Label>
                        <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                            <SelectTrigger className="w-full min-w-0 border-0 bg-muted/40 shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="12">12 grandes · 3 × 4</SelectItem>
                                <SelectItem value="24">24 medianas · 4 × 6</SelectItem>
                                <SelectItem value="40">40 pequeñas · 5 × 8</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="grid min-w-0 grid-cols-2 gap-3">
                        <div className="min-w-0 rounded-xl bg-muted/40 p-4">
                            <p className="truncate text-xs text-muted-foreground">Productos</p>
                            <p className="mt-1 truncate text-2xl font-semibold">{count}</p>
                        </div>
                        <div className="min-w-0 rounded-xl bg-muted/40 p-4">
                            <p className="truncate text-xs text-muted-foreground">Etiquetas</p>
                            <p className="mt-1 truncate text-2xl font-semibold">{totalCopies}</p>
                        </div>
                    </div>

                    <Button size="lg" className="w-full" onClick={openPdf} disabled={!count}><FileDown className="size-4" />Generar PDF</Button>
                    {!count && <p className="text-center text-xs text-muted-foreground">Selecciona al menos un producto para generar etiquetas.</p>}
                </CardContent>
            </Card>
        </div>
    );
}