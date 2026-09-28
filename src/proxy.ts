import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/pos", "/products", "/inventory", "/sales", "/customers", "/credits", "/purchases", "/cash", "/expenses", "/finance", "/operations", "/reports", "/audit", "/settings", "/users", "/manage", "/management", "/imports"];
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const buckets = new Map<string, { count: number; resetAt: number }>();

function ip(request: NextRequest) {
  return request.headers.get("x-real-ip")?.trim() || request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function burstAllowed(key: string, limit: number, windowMs = 60000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  current.count += 1;
  if (buckets.size > 5000) for (const [k, value] of buckets) if (value.resetAt <= now) buckets.delete(k);
  return current.count <= limit;
}

function verifiedSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin || (referer ? new URL(referer).origin : null);
  if (!candidate) return false;
  const configured = process.env.APP_URL ? new URL(process.env.APP_URL).origin : null;
  return candidate === request.nextUrl.origin || candidate === configured;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method.toUpperCase();
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  const isApi = path.startsWith("/api/");

  if (isApi) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) return NextResponse.json({ success: false, code: "PAYLOAD_TOO_LARGE", message: "Solicitud demasiado grande." }, { status: 413, headers: { "cache-control": "no-store" } });
    if (unsafe && (request.headers.get("sec-fetch-site") === "cross-site" || !verifiedSameOrigin(request))) return NextResponse.json({ success: false, code: "INVALID_ORIGIN", message: "Origen no autorizado." }, { status: 403, headers: { "cache-control": "no-store" } });
    const limit = unsafe ? 60 : 240;
    if (!burstAllowed(`${ip(request)}:${unsafe ? "write" : "read"}`, limit)) return NextResponse.json({ success: false, code: "RATE_LIMITED", message: "Demasiadas solicitudes. Intenta nuevamente en un minuto." }, { status: 429, headers: { "retry-after": "60", "cache-control": "no-store" } });
  }

  const protectedRoute = protectedPaths.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  const hasSession = Boolean(request.cookies.get("mdl_session")?.value);
  if (protectedRoute && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if (path === "/login" && hasSession) return NextResponse.redirect(new URL("/dashboard", request.url));

  const response = NextResponse.next();
  if (isApi) response.headers.set("cache-control", "no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
