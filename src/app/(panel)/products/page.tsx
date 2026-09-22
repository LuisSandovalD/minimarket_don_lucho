import Link from "next/link";
import { ChevronLeft, ChevronRight, Package, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { money } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
    await requirePermission("products.view");

    const { q = "", page = "1" } = await searchParams;
    const current = Math.max(1, Number(page) || 1);
    const where = {
        active: true,
        deletedAt: null,
        ...(q ? {
            OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { sku: { contains: q, mode: "insensitive" as const } },
                { barcodes: { some: { code: { contains: q } } } }
            ]
        } : {})
    };

    const [products, total] = await Promise.all([
        db.product.findMany({
            where,
            include: { unitOfMeasure: true, category: true, barcodes: { where: { primary: true }, take: 1 } },
            orderBy: { name: "asc" },
            skip: (current - 1) * PAGE_SIZE,
            take: PAGE_SIZE
        }),
        db.product.count({ where })
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const href = (page: number) => `/products?${new URLSearchParams({ ...(q && { q }), page: String(page) })}`;

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Package className="size-5 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Productos</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">{total} productos activos</p>
                </div>

                <Button asChild>
                    <Link href="/products/new"><Plus className="size-4" />Nuevo producto</Link>
                </Button>
            </div>

            <form className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" defaultValue={q} placeholder="Buscar por nombre, SKU o código..." className="border-0 bg-card pl-9 shadow-sm" />
            </form>

            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    <ScrollArea className="w-full">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="min-w-64 pl-6">Producto</TableHead>
                                    <TableHead className="min-w-44">SKU / código</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="pr-6">Estado</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {products.length ? products.map(product => {
                                    const low = product.stock.lessThanOrEqualTo(product.minimumStock);

                                    return (
                                        <TableRow key={product.id} className="hover:bg-muted/40">
                                            <TableCell className="pl-6">
                                                <Link href={`/products/${product.id}`} className="block min-w-0">
                                                    <p className="truncate font-medium hover:underline">{product.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{product.category?.name ?? "Sin categoría"}</p>
                                                </Link>
                                            </TableCell>

                                            <TableCell className="font-mono text-xs">
                                                <p>{product.sku}</p>
                                                <p className="text-muted-foreground">{product.barcodes[0]?.code ?? "—"}</p>
                                            </TableCell>

                                            <TableCell className="text-right font-medium">{money(product.salePrice.toString())}</TableCell>
                                            <TableCell className="text-right">{product.stock.toString()} {product.unitOfMeasure.symbol}</TableCell>

                                            <TableCell className="pr-6">
                                                <Badge variant="secondary" className={low ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}>
                                                    {low ? "Stock bajo" : "Disponible"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5}>
                                            <div className="flex min-h-52 flex-col items-center justify-center text-center">
                                                <Package className="mb-3 size-9 text-muted-foreground/40" />
                                                <p className="text-sm font-medium">No se encontraron productos</p>
                                                <p className="mt-1 text-xs text-muted-foreground">Prueba con otro nombre, SKU o código.</p>
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Página {current} de {totalPages}</p>

                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" asChild className={current <= 1 ? "pointer-events-none opacity-50" : ""}>
                            <Link href={href(current - 1)}><ChevronLeft className="size-4" />Anterior</Link>
                        </Button>

                        <Button variant="secondary" size="sm" asChild className={current >= totalPages ? "pointer-events-none opacity-50" : ""}>
                            <Link href={href(current + 1)}>Siguiente<ChevronRight className="size-4" /></Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
