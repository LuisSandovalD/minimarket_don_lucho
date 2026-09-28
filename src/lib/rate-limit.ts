import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";
import { AppError } from "./errors";

type HeaderReader = { get(name: string): string | null };

export function clientIpFromHeaders(h: HeaderReader) {
  return h.get("x-real-ip")?.trim() || h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function clientIp() {
  return clientIpFromHeaders(await headers());
}

export async function rateLimit(scope: string, subject: string, limit = 5, seconds = 900) {
  const normalized = subject.trim().toLowerCase().slice(0, 512) || "unknown";
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const key = createHash("sha256").update(`${scope}:${normalized}:${bucket}`).digest("hex");
  const result = await db.rateLimit.upsert({
    where: { key },
    create: { key, resetsAt: new Date((bucket + 1) * seconds * 1000) },
    update: { count: { increment: 1 } }
  });
  if (result.count > limit) throw new AppError("RATE_LIMITED", "Demasiados intentos. Intenta nuevamente más tarde.", 429);
}
