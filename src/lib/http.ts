import { NextResponse } from "next/server";
import { AppError, failure } from "./errors";

function originOf(url: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
}

/**
 * Acepta peticiones del mismo origen (incluye acceso por IP en LAN desde el
 * celular) o del APP_URL configurado. Los navegadores envían `Origin` en los
 * POST fetch; si la app se abre por IP local y APP_URL es localhost, el
 * origen no coincide y antes se rechazaba con 403.
 */
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const refererOrigin = originOf(request.headers.get("referer"));
  const configured = originOf(process.env.APP_URL || "");
  const forwardedHost = (request.headers.get("x-forwarded-host") || "").split(",")[0]?.trim();
  const host = forwardedHost || (request.headers.get("host") || "").split(",")[0]?.trim();
  const hostOrigin = (request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http") + "://" + host;

  const candidates = [origin, refererOrigin].filter((v): v is string => Boolean(v));
  // Sin Origin ni Referer (p. ej. herramientas internas): permitir, la
  // autenticación por sesión sigue siendo obligatoria.
  if (!candidates.length) return;
  if (host && candidates.some(c => { try { return new URL(c).host === host; } catch { return false; } })) return;
  if (hostOrigin !== "http://" && candidates.includes(hostOrigin)) return;
  if (configured && candidates.includes(configured)) return;
  throw new AppError("INVALID_ORIGIN", "Origen no autorizado.", 403);
}
export function apiError(error: unknown) {
  const result = failure(error);
  return NextResponse.json(result, { status: error instanceof AppError ? error.status : result.success ? 500 : result.code === "VALIDATION_ERROR" ? 400 : 500 });
}
