"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { PAYMENT_METHODS, PAYMENT_LABELS } from "@/lib/payment-methods";

type P = { id: string; name: string };
type S = { id: string; name: string };

export function PurchaseForm({ products, suppliers }: { products: P[]; suppliers: S[] }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([{ productId: products[0]?.id ?? "", quantity: 1, unitCost: 0 }]);
  const [method, setMethod] = useState("CASH");
  const [reason, setReason] = useState("Compra de mercadería");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const total = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) { toast.error("Selecciona proveedor."); return; }
    if (!items.length || items.some(i => !i.productId || i.quantity <= 0 || i.unitCost < 0)) { toast.error("Revisa productos, cantidades y costos."); return; }
    setPending(true);
    try {
      for (const it of items) {
        const r = await fetch("/api/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "purchase", key: crypto.randomUUID(), reason, supplierId, productId: it.productId, quantity: String(it.quantity), amount: String(it.unitCost), method }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
      }
      toast.success(items.length + " compra(s) registradas");
      router.push("/purchases");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="supplierId">Proveedor</Label>
          <Select value={supplierId || undefined} onValueChange={setSupplierId} disabled={pending}>
            <SelectTrigger id="supplierId" className="w-full"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="method">Método de pago</Label>
          <Select value={method} onValueChange={setMethod} disabled={pending}>
            <SelectTrigger id="method" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.filter(m => m !== "CREDIT").map(m => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2 xl:col-span-1">
          <Label htmlFor="reason">Motivo</Label>
          <Input id="reason" value={reason} minLength={3} required disabled={pending} onChange={e => setReason(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Productos</Label>
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setItems(c => [...c, { productId: products[0]?.id ?? "", quantity: 1, unitCost: 0 }])}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((it, ix) => (
            <div key={ix} className="grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-center">
              <Select value={it.productId || undefined} onValueChange={value => setItems(c => c.map((x, i) => i === ix ? { ...x, productId: value } : x))} disabled={pending}>
                <SelectTrigger className="w-full" aria-label="Producto"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Input type="number" min="0.0001" step="0.0001" value={it.quantity} placeholder="Cant." aria-label="Cantidad" disabled={pending} onChange={e => setItems(c => c.map((x, i) => i === ix ? { ...x, quantity: Number(e.target.value) || 0 } : x))} />
              <Input type="number" min="0" step="0.01" value={it.unitCost} placeholder="Costo" aria-label="Costo unitario" disabled={pending} onChange={e => setItems(c => c.map((x, i) => i === ix ? { ...x, unitCost: Number(e.target.value) || 0 } : x))} />

              <Button type="button" size="icon" variant="ghost" aria-label="Quitar producto" disabled={pending} onClick={() => setItems(c => c.filter((_, i) => i !== ix))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Total estimado</p>
        <p className="text-xl font-semibold tracking-tight">S/ {total.toFixed(2)}</p>
      </div>

      {pending && <p className="text-sm text-muted-foreground">Registrando cada línea; no cierres esta página.</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending ? "Registrando" : "Registrar compra"}
        </Button>
      </div>
    </form>
  );
}