"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { PAYMENT_METHODS, PAYMENT_LABELS } from "@/lib/payment-methods";

type P = { id: string; name: string; price: string };
type C = { id: string; name: string };

export function ManualSaleForm({ customers }: { customers: C[] }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [found, setFound] = useState<P[]>([]);
  const [items, setItems] = useState<{ productId: string; name: string; quantity: number; unitPrice: number }[]>([]);
  const [method, setMethod] = useState("CASH");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function search(value: string) {
    setQ(value);
    if (value.trim().length < 2) { setFound([]); return; }
    const r = await fetch("/api/products/search?q=" + encodeURIComponent(value));
    if (r.ok) { const j = await r.json(); setFound(j.data ?? []); }
  }

  function add(p: P) {
    setItems(cur => {
      const f = cur.find(x => x.productId === p.id);
      if (f) return cur.map(x => x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...cur, { productId: p.id, name: p.name, quantity: 1, unitPrice: Number(p.price) }];
    });
    setFound([]);
    setQ("");
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) { toast.error("Agrega productos."); return; }
    setPending(true);
    try {
      const r = await fetch("/api/sales", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), customerId, discount: 0, items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: 0 })), payments: [{ method, amount: Math.round(total * 100) / 100, receivedAmount: method === "CASH" ? Math.round(total * 100) / 100 : undefined }] }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast.success("Venta " + j.data.code + " registrada");
      router.push("/sales");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerId">Cliente</Label>
          <Select value={customerId || undefined} onValueChange={setCustomerId} disabled={pending}>
            <SelectTrigger id="customerId" className="w-full"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="method">Método de pago</Label>
          <Select value={method} onValueChange={setMethod} disabled={pending}>
            <SelectTrigger id="method" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative space-y-2">
        <Label htmlFor="productSearch">Agregar producto</Label>
        <Input
          id="productSearch"
          value={q}
          onChange={e => void search(e.target.value)}
          placeholder="Nombre, SKU o código…"
          autoComplete="off"
          disabled={pending}
        />
        <Search className="pointer-events-none absolute right-3 top-10 size-4 text-muted-foreground" />

        {found.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border-0 bg-popover p-1 shadow-xl">
            {found.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => add(p)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-muted-foreground">S/ {p.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Productos</Label>
        {items.length ? (
          <div className="space-y-2">
            {items.map((it, ix) => (
              <div key={it.productId} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/40 p-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.name}</span>

                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={it.quantity}
                  aria-label={`Cantidad de ${it.name}`}
                  disabled={pending}
                  onChange={e => setItems(c => c.map((x, i) => i === ix ? { ...x, quantity: Number(e.target.value) || 0 } : x))}
                  className="h-8 w-20"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.unitPrice}
                  aria-label={`Precio de ${it.name}`}
                  disabled={pending}
                  onChange={e => setItems(c => c.map((x, i) => i === ix ? { ...x, unitPrice: Number(e.target.value) || 0 } : x))}
                  className="h-8 w-24"
                />

                <Button size="icon" variant="ghost" type="button" aria-label={`Quitar ${it.name}`} disabled={pending} onClick={() => setItems(c => c.filter((_, i) => i !== ix))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="flex min-h-20 items-center justify-center gap-2 rounded-xl bg-muted/40 text-sm text-muted-foreground">
            <Plus className="size-4" />
            Busca y agrega productos a la venta.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-2xl font-semibold tracking-tight">S/ {total.toFixed(2)}</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !items.length}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending ? "Registrando" : "Registrar venta"}
        </Button>
      </div>
    </form>
  );
}