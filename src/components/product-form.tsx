"use client";

import { useActionState, useState } from "react";
import { createProductAction } from "@/modules/products/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Loader2, Save } from "lucide-react";

export function ProductForm({ units, categories, brands }: { units: { id: string; name: string; symbol: string; type: string; allowsDecimals: boolean }[]; categories: { id: string; name: string }[]; brands: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createProductAction, null);
  const [categoryId, setCategoryId] = useState(""), [brandId, setBrandId] = useState(""), [unitOfMeasureId, setUnitOfMeasureId] = useState(units[0]?.id ?? ""), [saleType, setSaleType] = useState("QUANTITY"), [allowsDecimals, setAllowsDecimals] = useState(false);
  const field = "border-0 bg-muted/40 shadow-sm";

  return <form action={action} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
    <input type="hidden" name="categoryId" value={categoryId} /><input type="hidden" name="brandId" value={brandId} /><input type="hidden" name="unitOfMeasureId" value={unitOfMeasureId} /><input type="hidden" name="saleType" value={saleType} /><input type="hidden" name="allowsDecimals" value={allowsDecimals ? "true" : "false"} /><input type="hidden" name="allowsDiscount" value="true" />

    <div className="space-y-2 sm:col-span-2 xl:col-span-3"><Label htmlFor="name">Nombre *</Label><Input id="name" name="name" required disabled={pending} placeholder="Nombre del producto" className={field} /></div>

    <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" name="sku" placeholder="Generación automática" disabled={pending} className={field} /></div>
    <div className="space-y-2"><Label htmlFor="barcode">Código de barras</Label><Input id="barcode" name="barcode" inputMode="numeric" placeholder="Código opcional" disabled={pending} className={field} /></div>

    <div className="space-y-2"><Label htmlFor="categoryId">Categoría</Label><Select value={categoryId || "none"} onValueChange={v => setCategoryId(v === "none" ? "" : v)} disabled={pending}><SelectTrigger id="categoryId" className={`w-full ${field}`}><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="none">Sin categoría</SelectItem>{categories.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></div>

    <div className="space-y-2"><Label htmlFor="brandId">Marca</Label><Select value={brandId || "none"} onValueChange={v => setBrandId(v === "none" ? "" : v)} disabled={pending}><SelectTrigger id="brandId" className={`w-full ${field}`}><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="none">Sin marca</SelectItem>{brands.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></div>

    <div className="space-y-2"><Label htmlFor="unitOfMeasureId">Unidad *</Label><Select value={unitOfMeasureId || undefined} onValueChange={setUnitOfMeasureId} disabled={pending}><SelectTrigger id="unitOfMeasureId" className={`w-full ${field}`}><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{units.map(x => <SelectItem key={x.id} value={x.id}>{x.name} ({x.symbol})</SelectItem>)}</SelectContent></Select></div>

    <div className="space-y-2"><Label htmlFor="saleType">Tipo de venta *</Label><Select value={saleType} onValueChange={setSaleType} disabled={pending}><SelectTrigger id="saleType" className={`w-full ${field}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="QUANTITY">Cantidad</SelectItem><SelectItem value="WEIGHT">Peso</SelectItem><SelectItem value="VOLUME">Volumen</SelectItem><SelectItem value="OTHER">Otro</SelectItem></SelectContent></Select></div>

    {[["purchasePrice", "Precio de compra *"], ["salePrice", "Precio de venta *"], ["wholesalePrice", "Precio mayorista"], ["stock", "Stock inicial"], ["minimumStock", "Stock mínimo"]].map(([name, label]) => <div key={name} className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type="number" min="0" step="0.0001" defaultValue={["stock", "minimumStock", "purchasePrice"].includes(name) ? "0" : undefined} required={["salePrice", "purchasePrice"].includes(name)} disabled={pending} className={field} /></div>)}

    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/40 p-3 sm:col-span-2 xl:col-span-3"><Checkbox id="allowsDecimals" checked={allowsDecimals} onCheckedChange={v => setAllowsDecimals(v === true)} disabled={pending} /><div><p className="text-sm font-medium">Permitir cantidades decimales</p><p className="text-xs text-muted-foreground">Útil para productos vendidos por peso o volumen.</p></div></label>

    {state && !state.success && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2 xl:col-span-3">{state.message}</p>}
    {state?.success && <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 sm:col-span-2 xl:col-span-3">Producto registrado correctamente.</p>}

    <div className="sm:col-span-2 xl:col-span-3"><Button type="submit" disabled={pending || !unitOfMeasureId} size="lg">{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "Guardando..." : "Guardar producto"}</Button></div>
  </form>;
}
