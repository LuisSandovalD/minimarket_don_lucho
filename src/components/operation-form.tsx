"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "./ui/alert-dialog";
import { Loader2, Wrench } from "lucide-react";
import { PAYMENT_LABELS } from "@/lib/payment-methods";

const labels: Record<string, string> = { purchase: "Registrar compra", "credit-payment": "Registrar abono", expense: "Registrar gasto", withdrawal: "Retirar efectivo", deposit: "Ingreso adicional", adjustment: "Ajustar inventario", "cancel-sale": "Anular venta", refund: "Devolver producto" };

export function OperationForm({ kinds, options }: { kinds: string[]; options: Record<string, { id: string; name: string }[]> }) {
  const [kind, setKind] = useState(kinds[0] ?? ""), [data, setData] = useState<Record<string, unknown>>({ method: "CASH", direction: "OUT", type: "ADJUSTMENT", returnsStock: true }), [pending, setPending] = useState(false), [confirm, setConfirm] = useState(false);
  const key = useRef<string | null>(null), router = useRouter();
  const fields = kind === "purchase" ? ["supplierId", "productId", "quantity", "amount", "batch", "expiresAt"] : kind === "credit-payment" ? ["customerId", "amount"] : kind === "expense" ? ["categoryId", "amount"] : kind === "adjustment" ? ["productId", "quantity"] : kind === "cancel-sale" ? ["saleId"] : kind === "refund" ? ["saleItemId", "quantity"] : ["amount"];
  const names: Record<string, string> = { supplierId: "Proveedor", productId: "Producto", quantity: "Cantidad", amount: kind === "purchase" ? "Costo unitario" : "Monto", customerId: "Cliente", categoryId: "Categoría del gasto", saleId: "Venta", saleItemId: "Producto vendido", batch: "Lote", expiresAt: "Vencimiento" };

  async function submit() {
    if (pending) return;
    key.current ??= crypto.randomUUID();
    setPending(true);
    try {
      const payload = { ...data, kind, key: key.current };
      const response = await fetch("/api/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success("Operación registrada");
      key.current = null;
      setData({ method: "CASH", direction: "OUT", type: "ADJUSTMENT", returnsStock: true });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar.");
    } finally {
      setPending(false);
      setConfirm(false);
    }
  }

  if (!kinds.length) return (
    <div className="flex min-h-40 flex-col items-center justify-center text-center">
      <Wrench className="mb-3 size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium">Sin operaciones disponibles</p>
      <p className="mt-1 text-xs text-muted-foreground">No tienes permisos para registrar operaciones.</p>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); setConfirm(true); }} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="kind">Tipo de operación</Label>
        <Select value={kind} onValueChange={value => { setKind(value); key.current = null; }} disabled={pending}>
          <SelectTrigger id="kind" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {kinds.map(k => <SelectItem key={k} value={k}>{labels[k]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(field => (
          <div className="space-y-2" key={field}>
            <Label htmlFor={field}>{names[field]}</Label>
            {field.endsWith("Id") ? (
              <Select value={String(data[field] || "none")} onValueChange={value => { key.current = null; setData({ ...data, [field]: value === "none" ? "" : value }); }} disabled={pending}>
                <SelectTrigger id={field} className="w-full"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar</SelectItem>
                  {(options[field] ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field}
                type={field === "expiresAt" ? "date" : field === "batch" ? "text" : "number"}
                min="0"
                step={field === "quantity" ? "0.0001" : "0.01"}
                required={!(["batch", "expiresAt"].includes(field))}
                disabled={pending}
                value={String(data[field] ?? "")}
                onChange={e => { key.current = null; setData({ ...data, [field]: e.target.value || undefined }); }}
              />
            )}
          </div>
        ))}
      </div>

      {!(["adjustment", "cancel-sale"].includes(kind)) && (
        <div className="space-y-2">
          <Label htmlFor="method">Método de pago</Label>
          <Select value={String(data.method)} onValueChange={method => setData({ ...data, method })} disabled={pending}>
            <SelectTrigger id="method" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(kind === "withdrawal" ? ["CASH"] : ["CASH", "YAPE", "PLIN", "CARD", "TRANSFER", "OTHER"]).map(m => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m] ?? m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {kind === "adjustment" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="direction">Dirección</Label>
            <Select value={String(data.direction)} onValueChange={direction => setData({ ...data, direction })} disabled={pending}>
              <SelectTrigger id="direction" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Entrada</SelectItem>
                <SelectItem value="OUT">Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de ajuste</Label>
            <Select value={String(data.type)} onValueChange={type => setData({ ...data, type })} disabled={pending}>
              <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                <SelectItem value="LOSS">Merma</SelectItem>
                <SelectItem value="DAMAGE">Daño</SelectItem>
                <SelectItem value="EXPIRATION">Vencimiento</SelectItem>
                <SelectItem value="INTERNAL_USE">Uso interno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {kind === "refund" && (
        <div className="flex items-center gap-3">
          <Switch id="returnsStock" checked={Boolean(data.returnsStock)} onCheckedChange={returnsStock => setData({ ...data, returnsStock })} disabled={pending} />
          <Label htmlFor="returnsStock" className="font-normal">Regresar al inventario</Label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo / observación</Label>
        <Textarea id="reason" minLength={3} required disabled={pending} value={String(data.reason ?? "")} onChange={e => setData({ ...data, reason: e.target.value })} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {labels[kind]}
        </Button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="border-0 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar operación</AlertDialogTitle>
            <AlertDialogDescription>Se actualizarán los saldos correspondientes y quedará un registro de auditoría.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={e => { e.preventDefault(); void submit(); }}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Guardando" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}