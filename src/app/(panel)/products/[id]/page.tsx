import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { dateTime, money } from "@/lib/utils";
import { ImageUpload } from "@/components/image-upload";
import { ProductImage } from "@/components/product-visual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("products.view");
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { unitOfMeasure: true, category: true, barcodes: true, batches: { orderBy: { expiresAt: "asc" }, take: 20 } } });
  if (!product) notFound();
  const low = product.stock.lessThanOrEqualTo(product.minimumStock);
  const info = [["Precio de venta", money(product.salePrice.toString())],["Precio de compra", money(product.purchasePrice.toString())],["Stock actual", `${product.stock} ${product.unitOfMeasure.symbol}`],["Stock mínimo", `${product.minimumStock} ${product.unitOfMeasure.symbol}`],["SKU", product.sku],["Códigos", product.barcodes.map(b => b.code).join(", ") || "—"]];

  return <div className="w-full space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-1"><div className="flex flex-wrap items-center gap-2"><Package className="size-5 text-muted-foreground"/><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1><Badge variant="secondary" className={low?"bg-amber-500/10 text-amber-700 dark:text-amber-400":"bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}>{low?"Stock bajo":"Disponible"}</Badge></div><p className="text-sm text-muted-foreground">{product.sku} · {product.category?.name??"Sin categoría"}</p></div><Button variant="secondary" asChild className="w-fit"><Link href="/products"><ArrowLeft className="size-4"/>Volver</Link></Button></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,.9fr)_1.1fr]">
      <Card className="overflow-hidden border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><ProductImage src={product.imageUrl} alt={product.name} className="aspect-square w-full min-h-72 rounded-3xl bg-muted/40 sm:min-h-96"/><div className="mt-4"><ImageUpload kind="products" id={product.id} imageUrl={product.imageUrl}/></div></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Información del producto</CardTitle><CardDescription>Precios, stock y códigos registrados.</CardDescription></CardHeader><CardContent><dl className="grid gap-3 sm:grid-cols-2">{info.map(([label,value])=><div key={label} className="rounded-2xl bg-muted/35 p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-base font-semibold">{value}</dd></div>)}</dl></CardContent></Card>
    </div>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Lotes</CardTitle><CardDescription>Últimos 20 lotes ordenados por vencimiento.</CardDescription></CardHeader><CardContent className="p-0">{product.batches.length?<ScrollArea className="w-full"><Table><TableHeader><TableRow><TableHead className="pl-6">Lote</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead>Recibido</TableHead><TableHead className="pr-6">Vencimiento</TableHead></TableRow></TableHeader><TableBody>{product.batches.map(batch=><TableRow key={batch.id}><TableCell className="pl-6 font-mono text-xs">{batch.batchNumber}</TableCell><TableCell className="text-right">{batch.quantity.toString()}</TableCell><TableCell className="text-muted-foreground">{dateTime(batch.receivedAt)}</TableCell><TableCell className="pr-6">{batch.expiresAt?<Badge variant="secondary" className="font-normal">{dateTime(batch.expiresAt)}</Badge>:<span className="text-muted-foreground">—</span>}</TableCell></TableRow>)}</TableBody></Table><ScrollBar orientation="horizontal"/></ScrollArea>:<div className="flex min-h-40 flex-col items-center justify-center text-center"><Package className="mb-3 size-8 text-muted-foreground/40"/><p className="text-sm font-medium">Sin lotes registrados</p><p className="mt-1 text-xs text-muted-foreground">Se crearán al registrar compras con lote o vencimiento.</p></div>}</CardContent></Card>
  </div>;
}
