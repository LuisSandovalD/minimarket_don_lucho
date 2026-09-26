"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Keyboard, Loader2, ScanLine, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

type Controls = { stop(): void };
type ZXing = {
  BrowserMultiFormatReader: new () => {
    decodeFromConstraints(
      c: MediaStreamConstraints,
      v: HTMLVideoElement,
      cb: (r: { getText(): string } | undefined) => void
    ): Promise<Controls>;
  };
};

declare global {
  interface Window {
    ZXingBrowser?: ZXing;
  }
}

const ZXING_URL = "https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js";

async function loadZXing() {
  if (window.ZXingBrowser) return window.ZXingBrowser;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${ZXING_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar el lector de cámara.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = ZXING_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el lector de cámara."));
    document.head.appendChild(script);
  });

  if (!window.ZXingBrowser) throw new Error("No se pudo inicializar el lector de códigos.");
  return window.ZXingBrowser;
}

export function CameraScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<Controls | null>(null);
  const onScanRef = useRef(onScan);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setCandidate("");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setCandidate("");

    if (!window.isSecureContext && location.hostname !== "localhost") {
      setError("La cámara requiere HTTPS. Abre el sistema desde la URL segura de Vercel o un dominio con HTTPS.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no permite acceder a la cámara.");
      return;
    }

    setLoading(true);
    try {
      setActive(true);
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      const video = videoRef.current;
      if (!video) throw new Error("No se pudo iniciar la cámara.");

      const ZX = await loadZXing();
      const reader = new ZX.BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        },
        video,
        result => {
          const code = result?.getText()?.trim();
          if (code) setCandidate(current => current === code ? current : code);
        }
      );
    } catch (e) {
      stop();
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setError("Permiso de cámara denegado. Habilítalo en los permisos del navegador.");
      } else if (e instanceof DOMException && e.name === "NotFoundError") {
        setError("No se encontró una cámara disponible.");
      } else if (e instanceof DOMException && e.name === "NotReadableError") {
        setError("La cámara está siendo utilizada por otra aplicación.");
      } else {
        setError(e instanceof Error ? e.message : "No se pudo abrir la cámara.");
      }
    } finally {
      setLoading(false);
    }
  }, [stop]);

  const capture = useCallback(() => {
    const code = candidate.trim();
    if (!code) {
      toast.info("Mantén el código dentro del recuadro hasta que sea detectado.");
      return;
    }

    onScanRef.current(code);
    toast.success("Código capturado");
    setCandidate("");
  }, [candidate]);

  useEffect(() => stop, [stop]);

  return (
    <div className="space-y-3">
      {active && (
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
          <video ref={videoRef} playsInline muted autoPlay className="aspect-[4/3] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-black/10">
            <div className="absolute inset-[12%]">
              <span className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-white" />
              <div className="absolute left-[8%] right-[8%] top-1/2 h-px bg-white/90" />
            </div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur">
              <ScanLine className="size-3.5" />
              {candidate ? "Código detectado · confirma para capturar" : "Centra el QR o código dentro del recuadro"}
            </div>
          </div>
        </div>
      )}

      {active && (
        <div className="rounded-2xl bg-muted/40 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={candidate ? "size-4 text-emerald-600" : "size-4 text-muted-foreground"} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Código detectado</p>
              <p className="truncate font-mono text-sm font-medium">{candidate || "Esperando lectura…"}</p>
            </div>
          </div>
          <Button type="button" className="mt-3 w-full" disabled={!candidate} onClick={capture}>
            <ScanLine className="size-4" />
            Capturar QR / código
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            La cámara no agrega productos automáticamente. Cada lectura requiere confirmar con este botón.
          </p>
        </div>
      )}

      {error && (
        <Alert className="border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <TriangleAlert className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!active ? (
        <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={() => void start()}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {loading ? "Abriendo cámara..." : "Escanear con cámara"}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={stop}>
            <CameraOff className="size-4" />
            Detener cámara
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => toast.info("El lector físico USB/Bluetooth sigue disponible; también puedes escribir el código manualmente.")}
            aria-label="Otras formas de escaneo"
          >
            <Keyboard className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
