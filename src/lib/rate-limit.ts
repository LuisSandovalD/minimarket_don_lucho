import { createHash } from "node:crypto";
import { db } from "./db";
import { AppError } from "./errors";
export async function rateLimit(scope: string, subject: string, limit = 5, seconds = 900) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const key = createHash("sha256").update(`${scope}:${subject}:${bucket}`).digest("hex");
  const result = await db.rateLimit.upsert({ where: { key }, create: { key, resetsAt: new Date((bucket + 1) * seconds * 1000) }, update: { count: { increment: 1 } } });
  if (result.count > limit) throw new AppError("RATE_LIMITED", "Demasiados intentos. Espera unos minutos.", 429);
}
