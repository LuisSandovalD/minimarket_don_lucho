"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ImageUpload({ kind, id, imageUrl }: { kind: string; id: string; imageUrl?: string | null }) {
  const [preview, setPreview] = useState(imageUrl ?? "");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(file?: File) {
    if (!file || pending) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Usa una imagen JPG, PNG o WEBP.");

    const local = URL.createObjectURL(file);
    setPending(true);
    setPreview(local);

    try {
      const data = new FormData();
      data.set("file", file);

      const res = await fetch(`/api/images/${kind}/${id}`, { method: "POST", body: data });
      const body = await res.json();

      if (!res.ok) throw new Error(body.message);

      setPreview(body.data.imageUrl);
      toast.success("Imagen guardada correctamente.");
      router.refresh();
    } catch (error) {
      setPreview(imageUrl ?? "");
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    } finally {
      URL.revokeObjectURL(local);
      setPending(false);
    }
  }

  return (
    <div
      className="w-full rounded-xl bg-muted/35 p-4 shadow-sm transition-colors hover:bg-muted/50"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        void upload(e.dataTransfer.files[0]);
      }}
    >
      <Input
        ref={inputRef}
        id={`image-${id}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={pending}
        className="hidden"
        onChange={e => void upload(e.target.files?.[0])}
      />

      {preview ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative size-32 shrink-0 overflow-hidden rounded-xl bg-background shadow-sm">
            <Image src={preview} alt="Vista previa" fill unoptimized className="object-contain p-2" />

            {pending && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{pending ? "Subiendo imagen..." : "Imagen actual"}</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WEBP. Puedes arrastrar una nueva imagen para reemplazarla.</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" />
                Cambiar imagen
              </Button>

              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setPreview("")}>
                <X className="size-4" />
                Ocultar vista previa
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl bg-background/60 px-6 text-center shadow-sm transition hover:bg-background disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? <Loader2 className="mb-3 size-8 animate-spin text-muted-foreground" /> : <ImagePlus className="mb-3 size-8 text-muted-foreground/60" />}
          <p className="text-sm font-medium">{pending ? "Subiendo imagen..." : "Subir imagen"}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">Haz clic para seleccionar o arrastra una imagen aquí.</p>
          <p className="mt-1 text-xs text-muted-foreground">JPG · PNG · WEBP</p>
        </button>
      )}
    </div>
  );
}