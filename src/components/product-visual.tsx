"use client";

import Image from "next/image";
import { ImageIcon, Search, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { money } from "@/lib/utils";

export type ProductVisualRow = {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock: string;
  unit: string;
  imageUrl?: string | null;
  code?: string | null;
};

export function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-2xl bg-muted/50 shadow-sm", className)}>
      {src ? (
        <Image src={src} alt={alt} fill unoptimized sizes="160px" className="object-contain p-2" />
      ) : (
        <div className="flex h-full w-full items-center justify-center"><ImageIcon className="size-6 text-muted-foreground/40" /></div>
      )}
    </div>
  );
}

export function ProductPicker({ value, onSelect, disabled, placeholder = "Seleccionar producto" }: { value?: string; onSelect: (product: ProductVisualRow) => void; disabled?: boolean; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ProductVisualRow[]>([]);
  const [loading, setLoading] = useState(false);
  const selected = useMemo(() => rows.find(x => x.id === value), [rows, value]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=30`, { signal: controller.signal });
        if (!r.ok) return;
        const j = await r.json();
        setRows(j.data ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setRows([]);
      } finally {
        setLoading(false);
      }
    }, query ? 180 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={e => setQuery(e.target.value)} disabled={disabled} placeholder={placeholder} className="h-11 border-0 bg-muted/40 pl-9 shadow-sm" />
      </div>
      {selected && !query && (
        <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-3 shadow-sm">
          <ProductImage src={selected.imageUrl} alt={selected.name} className="size-14 rounded-xl" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selected.name}</p><p className="text-xs text-muted-foreground">{selected.sku} · Stock {selected.stock} {selected.unit}</p></div>
          <Check className="size-4 text-primary" />
        </div>
      )}
      <div className="max-h-80 space-y-1 overflow-y-auto rounded-2xl bg-popover p-1 shadow-xl">
        {loading ? <div className="px-3 py-5 text-center text-sm text-muted-foreground">Buscando productos…</div> : rows.length ? rows.map(product => (
          <button type="button" key={product.id} onClick={() => { onSelect(product); setQuery(""); }} disabled={disabled} className={cn("flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-accent", value === product.id && "bg-accent") }>
            <ProductImage src={product.imageUrl} alt={product.name} className="size-14 rounded-xl" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="truncate text-xs text-muted-foreground">{product.sku}{product.code ? ` · ${product.code}` : ""}</p><p className="mt-0.5 text-xs text-muted-foreground">Stock {product.stock} {product.unit}</p></div>
            <div className="shrink-0 text-right"><p className="text-sm font-semibold">{money(product.price)}</p>{value === product.id && <Check className="ml-auto mt-1 size-4 text-primary" />}</div>
          </button>
        )) : <div className="px-3 py-5 text-center text-sm text-muted-foreground">No se encontraron productos.</div>}
      </div>
    </div>
  );
}
