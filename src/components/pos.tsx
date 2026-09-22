"use client";
<<<<<<< HEAD

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraScanner } from "./camera-scanner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { money } from "@/lib/utils";
import { PAYMENT_METHODS, PAYMENT_LABELS } from "@/lib/payment-methods";
import { toast } from "sonner";
import { Banknote, Minus, Plus, Search, ShoppingCart, Trash2, UserPlus, X } from "lucide-react";

export type PRow = { id: string; sku: string; name: string; price: string; stock: string; unit: string };
export type Crow = { id: string; name: string; general: boolean };
export type PayL = { method: string; amount: number; received?: number };

export function Pos({ customerId, customers }: { customerId: string; customers: Crow[] }) {
    const [q, setQ] = useState(""), [results, setResults] = useState<PRow[]>([]), [cart, setCart] = useState<(PRow & { quantity: number })[]>([]), [customer, setCustomer] = useState(customerId), [customerQuery, setCustomerQuery] = useState(""), [payments, setPayments] = useState<PayL[]>([{ method: "CASH", amount: 0 }]), [loading, setLoading] = useState(false), [last, setLast] = useState<{ code: string; id: string } | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const subtotal = cart.reduce((s, x) => s + Number(x.price) * x.quantity, 0), total = Math.round(subtotal * 100) / 100, paid = Math.round(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100) / 100, pending = Math.round((total - paid) * 100) / 100, currentCustomer = customers.find(c => c.id === customer);
    const filteredCustomers = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase())).slice(0, 50), [customers, customerQuery]);

    const add = useCallback((p: PRow) => { setCart(c => { const e = c.find(x => x.id === p.id); return e ? c.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x) : [...c, { ...p, quantity: 1 }] }); setQ(""); setResults([]) }, []);
    const updatePayment = (i: number, v: Partial<PayL>) => setPayments(p => p.map((x, n) => n === i ? { ...x, ...v } : x));

    const search = useCallback(async (v: string) => { if (!v.trim()) return setResults([]); const r = await fetch(`/api/products/search?q=${encodeURIComponent(v)}`), j = await r.json(); if (j.data?.length === 1 && j.data[0].sku.toLowerCase() === v.trim().toLowerCase()) add(j.data[0]); else setResults(j.data ?? []) }, [add]);

    const scan = useCallback(async (code: string) => { const v = code.trim(); if (!v) return; const r = await fetch(`/api/products/search?q=${encodeURIComponent(v)}`), j = await r.json(); if (j.data?.length) { add(j.data[0]); toast.success(`${j.data[0].name} agregado`) } else toast.error("Producto no registrado") }, [add]);

    async function charge() {
        if (!cart.length || loading) return;
        if (Math.abs(paid - total) > .009) return toast.error("Los pagos deben sumar el total.");
        if (payments.some(p => p.method === "CREDIT") && currentCustomer?.general) return toast.error("No se puede fiar a Cliente General.");
        setLoading(true);
        try {
            const r = await fetch("/api/sales", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), customerId: customer, discount: 0, items: cart.map(x => ({ productId: x.id, quantity: x.quantity, unitPrice: x.price, discount: 0 })), payments: payments.map(x => ({ method: x.method, amount: Number(x.amount), receivedAmount: x.method === "CASH" ? Number(x.received || x.amount) : undefined })) }) }), j = await r.json();
            if (!r.ok) throw new Error(j.message);
            toast.success(`Venta ${j.data.code} registrada`); setLast({ code: j.data.code, id: j.data.id }); setCart([]); setPayments([{ method: "CASH", amount: 0 }]);
        } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo registrar.") } finally { setLoading(false) }
    }

    async function createCustomer() {
        const name = window.prompt("Nombre del cliente"); if (!name?.trim()) return;
        const r = await fetch("/api/catalog/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: name.trim() }) }), j = await r.json();
        if (!r.ok) return toast.error(j.message || "No se pudo crear.");
        toast.success("Cliente creado"); setCustomer(j.data.id);
    }

    useEffect(() => { const t = setTimeout(() => void search(q), 220); return () => clearTimeout(t) }, [q, search]);
    useEffect(() => setPayments(p => p.length === 1 && p[0].method === "CASH" ? [{ ...p[0], amount: total }] : p), [total]);
    useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus() } if (e.key === "F4") { e.preventDefault(); document.getElementById("pos-customer")?.focus() } if (e.key === "F8") { e.preventDefault(); document.getElementById("charge")?.click() } if (e.key === "Escape") setResults([]) }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h) }, []);

    return <div className="grid gap-5 xl:grid-cols-[.8fr_1.4fr_.9fr]">
        <section className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input ref={searchRef} autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && q.trim() && scan(q)} placeholder="Escanea o busca producto (F2)" className="h-11 border-0 bg-muted/50 pl-9 shadow-sm" /></div>
            <CameraScanner onScan={scan} />
            <div className="space-y-2">{results.map(p => <button key={p.id} onClick={() => add(p)} className="flex w-full items-center justify-between rounded-xl bg-card p-4 text-left shadow-sm transition hover:bg-accent"><div className="min-w-0"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku} · Stock {p.stock}</p></div><span className="ml-4 shrink-0 font-semibold">{money(p.price)}</span></button>)}</div>
        </section>

        <Card className="h-fit border-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3"><div className="flex items-center gap-2"><ShoppingCart className="size-4 text-muted-foreground" /><CardTitle className="text-base">Carrito</CardTitle><Badge variant="secondary">{cart.length}</Badge></div>{!!cart.length && <Button variant="ghost" size="sm" onClick={() => setCart([])}><X className="size-4" />Limpiar</Button>}</CardHeader>
            <CardContent>{cart.length ? <div className="space-y-2">{cart.map(x => <div key={x.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{x.name}</p><p className="text-xs text-muted-foreground">{money(x.price)} / {x.unit}</p></div><div className="flex items-center rounded-lg bg-background shadow-sm"><Button variant="ghost" size="icon" className="size-8" onClick={() => setCart(c => c.map(i => i.id === x.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}><Minus className="size-3.5" /></Button><span className="w-8 text-center text-sm font-medium">{x.quantity}</span><Button variant="ghost" size="icon" className="size-8" onClick={() => setCart(c => c.map(i => i.id === x.id ? { ...i, quantity: i.quantity + 1 } : i))}><Plus className="size-3.5" /></Button></div><span className="min-w-20 text-right text-sm font-semibold">{money(Number(x.price) * x.quantity)}</span><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setCart(c => c.filter(i => i.id !== x.id))}><Trash2 className="size-4" /></Button></div>)}</div> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><ShoppingCart className="mb-3 size-10 text-muted-foreground/40" /><p className="text-sm font-medium">Carrito vacío</p><p className="mt-1 text-xs text-muted-foreground">Escanea o selecciona un producto.</p></div>}
                {last && <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm"><span>Última venta: <strong>{last.code}</strong></span><a href={`/api/sales/${last.id}/ticket`} target="_blank" className="font-medium hover:underline">Ver ticket</a></div>}</CardContent>
        </Card>

        <Card className="h-fit border-0 shadow-sm"><CardContent className="space-y-5 p-5">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p><p className="mt-1 text-4xl font-semibold tracking-tight">{money(total)}</p><p className="mt-1 text-xs text-muted-foreground">Subtotal {money(subtotal)}</p></div><Separator />
            <div className="space-y-2"><label className="text-sm font-medium">Cliente</label><Select value={customer} onValueChange={setCustomer}><SelectTrigger id="pos-customer" className="w-full border-0 bg-muted/50 shadow-sm"><SelectValue /></SelectTrigger><SelectContent>{filteredCustomers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><div className="flex gap-2"><Input value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} placeholder="Filtrar clientes..." className="border-0 bg-muted/50 shadow-sm" /><Button variant="secondary" size="icon" onClick={createCustomer}><UserPlus className="size-4" /></Button></div></div><Separator />
            <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Pagos</p><p className="text-xs text-muted-foreground">Permite pago mixto</p></div><Button variant="secondary" size="sm" onClick={() => setPayments(p => [...p, { method: "YAPE", amount: Math.max(0, pending) }])}><Plus className="size-4" />Agregar</Button></div>
                {payments.map((p, i) => <div key={i} className="space-y-2 rounded-xl bg-muted/40 p-3"><div className="flex gap-2"><Select value={p.method} onValueChange={method => updatePayment(i, { method })}><SelectTrigger className="flex-1 border-0 bg-background shadow-sm"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}</SelectContent></Select>{payments.length > 1 && <Button variant="ghost" size="icon" onClick={() => setPayments(x => x.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button>}</div><div className="grid gap-2 sm:grid-cols-2"><Input type="number" min="0" step=".01" value={p.amount || ""} placeholder="Monto" className="border-0 bg-background shadow-sm" onChange={e => updatePayment(i, { amount: Number(e.target.value) || 0 })} />{p.method === "CASH" && <Input type="number" min="0" step=".01" value={p.received ?? ""} placeholder="Recibido" className="border-0 bg-background shadow-sm" onChange={e => updatePayment(i, { received: Number(e.target.value) || 0 })} />}</div></div>)}
                <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Pagado</p><p className="font-semibold">{money(paid)}</p></div><div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{pending > 0 ? "Pendiente" : "Total"}</p><p className="font-semibold">{pending > 0 ? money(pending) : money(total)}</p></div></div></div>
            <Button id="charge" size="lg" className="w-full shadow-sm" disabled={!cart.length || loading || Math.abs(paid - total) > .009} onClick={charge}><Banknote className="size-4" />{loading ? "Procesando..." : `Cobrar ${money(total)} (F8)`}</Button>
        </CardContent></Card>
    </div>;
}
=======
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { money } from "@/lib/utils";
type Product={id:string;sku:string;name:string;price:string;stock:string;allowsDecimals:boolean;unit:string};
type Line=Product&{quantity:number};
export function Pos({customerId}:{customerId:string}) {
  const [query,setQuery]=useState(""); const [results,setResults]=useState<Product[]>([]); const [cart,setCart]=useState<Line[]>([]);
  const [payment,setPayment]=useState<"CASH"|"YAPE"|"PLIN"|"CARD"|"TRANSFER">("CASH"); const [received,setReceived]=useState(""); const [loading,setLoading]=useState(false); const input=useRef<HTMLInputElement>(null);
  const total=cart.reduce((sum,line)=>sum+Number(line.price)*line.quantity,0);
  const add=useCallback((product:Product)=>{setCart(current=>{const found=current.find(x=>x.id===product.id);return found?current.map(x=>x.id===product.id?{...x,quantity:x.quantity+1}:x):[...current,{...product,quantity:1}]});setQuery("");setResults([]);requestAnimationFrame(()=>input.current?.focus())},[]);
  const search=useCallback(async(value:string)=>{if(!value.trim()){setResults([]);return}const response=await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);const json=await response.json();if(json.data.length===1&&(json.data[0].sku.toLowerCase()===value.toLowerCase()))add(json.data[0]);else setResults(json.data)},[add]);
  useEffect(()=>{const timer=setTimeout(()=>search(query),200);return()=>clearTimeout(timer)},[query,search]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==="F2"){event.preventDefault();input.current?.focus()}if(event.key==="F8"){event.preventDefault();document.getElementById("charge")?.click()}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[]);
  async function charge(){if(!cart.length)return;setLoading(true);try{const response=await fetch("/api/sales",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({idempotencyKey:crypto.randomUUID(),customerId,discount:0,items:cart.map(x=>({productId:x.id,quantity:x.quantity,unitPrice:x.price,discount:0})),payments:[{method:payment,amount:total,receivedAmount:payment==="CASH"?Number(received||total):undefined}]})});const json=await response.json();if(!response.ok)throw new Error(json.message);toast.success(`Venta ${json.data.code} registrada`);setCart([]);setReceived("");input.current?.focus()}catch(error){toast.error(error instanceof Error?error.message:"No se pudo registrar la venta")}finally{setLoading(false)}}
  return <div className="grid min-h-[calc(100vh-8rem)] gap-5 xl:grid-cols-[1fr_1.4fr_.8fr]">
    <section className="space-y-3"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-[var(--muted)]"/><Input ref={input} autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Escanea o busca (F2)" className="pl-9"/></div><div className="space-y-2">{results.map(product=><button key={product.id} onClick={()=>add(product)} className="flex w-full justify-between rounded-xl bg-[var(--card)] p-4 text-left shadow-sm hover:ring-2 hover:ring-[var(--primary)]"><span><strong className="block">{product.name}</strong><span className="text-xs text-[var(--muted)]">{product.sku} · Stock {product.stock}</span></span><strong>{money(product.price)}</strong></button>)}</div></section>
    <section className="rounded-xl bg-[var(--card)] p-4 shadow-sm"><h2 className="font-semibold">Carrito</h2><div className="mt-4 space-y-2">{cart.map(line=><div key={line.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div><p className="font-medium">{line.name}</p><p className="text-xs text-[var(--muted)]">{money(line.price)} / {line.unit}</p></div><div className="flex items-center"><Button variant="ghost" size="icon" onClick={()=>setCart(c=>c.map(x=>x.id===line.id?{...x,quantity:Math.max(line.allowsDecimals?.001:1,x.quantity-(line.allowsDecimals?.001:1))}:x))}><Minus className="size-4"/></Button><input aria-label={`Cantidad de ${line.name}`} className="w-16 bg-transparent text-center" type="number" min={line.allowsDecimals?.001:1} step={line.allowsDecimals?.001:1} value={line.quantity} onChange={e=>setCart(c=>c.map(x=>x.id===line.id?{...x,quantity:Number(e.target.value)}:x))}/><Button variant="ghost" size="icon" onClick={()=>setCart(c=>c.map(x=>x.id===line.id?{...x,quantity:x.quantity+(line.allowsDecimals?.001:1)}:x))}><Plus className="size-4"/></Button></div><div className="flex items-center gap-2"><strong>{money(Number(line.price)*line.quantity)}</strong><Button variant="ghost" size="icon" onClick={()=>setCart(c=>c.filter(x=>x.id!==line.id))}><Trash2 className="size-4"/></Button></div></div>)}{!cart.length&&<p className="py-20 text-center text-sm text-[var(--muted)]">Escanea un producto para comenzar.</p>}</div></section>
    <aside className="h-fit rounded-xl bg-[var(--card)] p-5 shadow-sm"><p className="text-sm text-[var(--muted)]">Total</p><p className="mt-1 text-4xl font-semibold">{money(total)}</p><label className="mt-6 block text-sm font-medium">Método de pago</label><select value={payment} onChange={e=>setPayment(e.target.value as typeof payment)} className="mt-2 h-10 w-full rounded-lg bg-[var(--card)] px-3 ring-1 ring-[var(--border)]"><option value="CASH">Efectivo</option><option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="CARD">Tarjeta</option><option value="TRANSFER">Transferencia</option></select>{payment==="CASH"&&<><label className="mt-4 block text-sm font-medium">Recibido</label><Input value={received} onChange={e=>setReceived(e.target.value)} type="number" min={total} step="0.01" className="mt-2"/><p className="mt-2 text-sm text-[var(--muted)]">Vuelto: {money(Math.max(0,Number(received||0)-total))}</p></>}<Button id="charge" className="mt-6 w-full" disabled={!cart.length||loading||(payment==="CASH"&&Number(received||0)<total)} onClick={charge}>{loading?"Procesando…":"Cobrar (F8)"}</Button></aside>
  </div>
}
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
