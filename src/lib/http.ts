import { NextResponse } from "next/server";
import { AppError, failure } from "./errors";

function originOf(url: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
}

export function checkOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return;
  const origin = originOf(request.headers.get("origin"));
  const refererOrigin = originOf(request.headers.get("referer"));
  const configured = originOf(process.env.APP_URL || "");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "");
  const hostOrigin = host ? `${proto}://${host}` : null;
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") throw new AppError("INVALID_ORIGIN", "Origen no autorizado.", 403);
  const candidates = [origin, refererOrigin].filter((v): v is string => Boolean(v));
  if (!candidates.length) throw new AppError("INVALID_ORIGIN", "La solicitud no contiene un origen verificable.", 403);
  if (hostOrigin && candidates.includes(hostOrigin)) return;
  if (configured && candidates.includes(configured)) return;
  throw new AppError("INVALID_ORIGIN", "Origen no autorizado.", 403);
}

export function apiError(error: unknown) {
  const result = failure(error);
  const status = error instanceof AppError ? error.status : result.success ? 500 : result.code === "VALIDATION_ERROR" ? 400 : 500;
  return NextResponse.json(result, { status, headers: { "cache-control": "no-store" } });
}
