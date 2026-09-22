"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Product = { id: string; name: string; price: string; sku?: string; stock?: string };
type Customer = { id: string; name: string };
type Item = { productId: string; name: string; quantity: number; unitPrice: number };

const methods = { CASH: "Efectivo", YAPE: "Yape", PLIN: "Plin", CARD: "Tarjeta", TRANSFER: "Transferencia", CREDIT: "Fiado", OTHER: "Otro" };

export function ManualSaleForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [method, setMethod] = useState("CASH");
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);

  const total = items.reduce((s, x) => s + x.quantity * x.unitPrice, 0);
  const customer = customers.find(x => x.id === customerId);

  async function searchProducts(value: string) {
    setSearching(true);
    try {
      const r = await fetch(`/api/products/search?q=${encodeURIComponent(value)}&limit=30`);
      const j = await r.json();
      setProducts(r.ok ? j.data ?? [] : []);
    } finally {
      setSearching(false);
    }
  }

  function add(product: Product) {
    setItems(cur => {
      const exists = cur.find(x => x.productId === product.id);
      return exists
        ? cur.map(x => x.productId === product.id ? { ...x, quantity: x.quantity + 1 } : x)
        : [...cur, { productId: product.id, name: product.name, quantity: 1, unitPrice: Number(product.price) }];
    });
    setProductOpen(false);
  }

  function update(index: number, data: Partial<Item>) {
    setItems(cur => cur.map((x, i) => i === index ? { ...x, ...data } : x));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return toast.error("Selecciona un cliente.");
    if (!items.length) return toast.error("Selecciona al menos un producto.");

    setPending(true);
    try {
      const r = await fetch("/api/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          customerId,
          discount: 0,
          items: items.map(x => ({ productId: x.productId, quantity: x.quantity, unitPrice: x.unitPrice, discount: 0 })),
          payments: [{ method, amount: Math.round(total * 100) / 100, receivedAmount: method === "CASH" ? Math.round(total * 100) / 100 : undefined }]
        })
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.message);

      toast.success(`Venta ${j.data.code} registrada`);
      router.push("/sales");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
      <div className="space-y-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente</Label>

              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="secondary" className="w-full justify-between font-normal">
                    <span className="truncate">{customer?.name ?? "Seleccionar cliente"}</span>
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-0 p-0 shadow-xl" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                      <CommandGroup>
                        {customers.map(x => (
                          <CommandItem key={x.id} value={x.name} onSelect={() => { setCustomerId(x.id); setCustomerOpen(false); }}>
                            <Check className={cn("size-4", customerId === x.id ? "opacity-100" : "opacity-0")} />
                            {x.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Producto</Label>

              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="secondary" className="w-full justify-between font-normal" onClick={() => !products.length && void searchProducts("")}>
                    <span className="flex items-center gap-2"><Search className="size-4" />Buscar o seleccionar producto</span>
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-0 p-0 shadow-xl" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Nombre, SKU o código..." onValueChange={value => void searchProducts(value)} />
                    <CommandList>
                      {searching ? (
                        <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />Buscando...
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No se encontraron productos.</CommandEmpty>
                          <CommandGroup>
                            {products.map(p => (
                              <CommandItem key={p.id} value={p.id} onSelect={() => add(p)} className="flex justify-between">
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{p.name}</p>
                                  <p className="text-xs text-muted-foreground">{p.sku ?? "Sin SKU"}{p.stock && ` · Stock ${p.stock}`}</p>
                                </div>
                                <span className="ml-3 font-medium">S/ {Number(p.price).toFixed(2)}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-muted-foreground" />Productos
            </CardTitle>
            <Badge variant="secondary">{items.length}</Badge>
          </CardHeader>

          <CardContent>
            {items.length ? (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={item.productId} className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">S/ {item.unitPrice.toFixed(2)} c/u</p>
                    </div>

                    <div className="flex items-center rounded-lg bg-background shadow-sm">
                      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => update(i, { quantity: Math.max(1, item.quantity - 1) })}><Minus className="size-3.5" /></Button>
                      <Input type="number" min="1" step="1" value={item.quantity} onChange={e => update(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="h-8 w-14 border-0 text-center shadow-none" />
                      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => update(i, { quantity: item.quantity + 1 })}><Plus className="size-3.5" /></Button>
                    </div>

                    <span className="min-w-24 text-right text-sm font-semibold">S/ {(item.quantity * item.unitPrice).toFixed(2)}</span>

                    <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setItems(c => c.filter((_, ix) => ix !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <ShoppingCart className="mb-3 size-9 text-muted-foreground/40" />
                <p className="text-sm font-medium">Selecciona productos</p>
                <p className="mt-1 text-xs text-muted-foreground">Utiliza el selector superior para buscarlos rápidamente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit border-0 shadow-sm xl:sticky xl:top-20">
        <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">S/ {total.toFixed(2)}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full border-0 bg-muted/40 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(methods).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Productos</span><span>{items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Unidades</span><span>{items.reduce((s, x) => s + x.quantity, 0)}</span></div>
            <div className="flex justify-between font-medium"><span>Total</span><span>S/ {total.toFixed(2)}</span></div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={pending || !customerId || !items.length}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
            {pending ? "Registrando..." : `Registrar venta · S/ ${total.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}