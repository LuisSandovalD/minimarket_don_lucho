"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard, ScanLine, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

type ScanHandler = (code: string) => void;
type Detector = new (options?: { formats?: string[] }) => {
  detect(video: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};

export function CameraScanner({ onScan }: { onScan: ScanHandler }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef({ code: "", at: 0 });
  const onScanRef = useRef(onScan);
  const [active, setActive] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);

    const BarcodeDetector = (window as unknown as { BarcodeDetector?: Detector }).BarcodeDetector;
    if (!BarcodeDetector) return setUnsupported(true);

    if (!navigator.mediaDevices?.getUserMedia)
      return setError("La cámara no está disponible en este navegador.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      streamRef.current = stream;
      setActive(true);

      await new Promise(resolve => requestAnimationFrame(resolve));

      const video = videoRef.current;
      if (!video) {
        stop();
        return setError("No se pudo iniciar la cámara.");
      }

      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({
        formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"]
      });

      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;

        try {
          const result = await detector.detect(videoRef.current);
          const code = result[0]?.rawValue?.trim();

          if (code) {
            const now = Date.now();

            if (code !== lastRef.current.code || now - lastRef.current.at > 2500) {
              lastRef.current = { code, at: now };
              onScanRef.current?.(code);
            }
          }
        } catch { }

        rafRef.current = requestAnimationFrame(() => void tick());
      };

      void tick();
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Permiso de cámara denegado. Habilítalo desde la configuración del navegador."
          : "No se pudo acceder a la cámara."
      );
      stop();
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  if (unsupported) {
    return (
      <Alert className="border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        <TriangleAlert className="size-4" />
        <AlertDescription>
          Este navegador no admite lectura de códigos mediante cámara. Usa un lector USB o ingresa el código manualmente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {active && (
        <div className="relative overflow-hidden rounded-xl bg-black shadow-sm">
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />

          <div className="pointer-events-none absolute inset-0 bg-black/15">
            <div className="absolute inset-[12%] flex items-center justify-center">
              <div className="relative h-full w-full max-w-sm">
                <span className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-white" />
                <span className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-white" />
                <span className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-white" />
                <span className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-white" />
                <div className="absolute left-[8%] right-[8%] top-1/2 h-px bg-white/80 shadow-[0_0_12px_rgba(255,255,255,.8)]" />
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <ScanLine className="size-3.5" />
              Apunta al código
            </div>
          </div>
        </div>
      )}

      {!active && <video ref={videoRef} playsInline muted className="hidden" />}

      {error && (
        <Alert className="border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <TriangleAlert className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!active ? (
        <Button type="button" variant="secondary" className="w-full" onClick={() => void start()}>
          <Camera className="size-4" />
          Escanear con cámara
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
            onClick={() => toast.info("También puedes usar un lector USB o ingresar el código manualmente.")}
            aria-label="Otras formas de lectura"
          >
            <Keyboard className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}