import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { AppError } from "./errors";
export async function transact<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try { return await db.$transaction(work, { isolationLevel: "Serializable", timeout: 20000 }); }
    catch (error) { if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !["P2034", "P2002"].includes(error.code) || attempt === 3) throw error; }
  }
  throw new AppError("CONFLICT", "Operación concurrente. Intenta nuevamente.", 409);
}
export async function once(tx: Prisma.TransactionClient, key: string, userId: string, kind: string, payload: unknown, work: () => Promise<{ id: string }>) {
  const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const old = await tx.operation.findUnique({ where: { key } });
  if (old) {
    if (old.userId !== userId || old.kind !== kind || old.fingerprint !== fingerprint) throw new AppError("IDEMPOTENCY_CONFLICT", "La solicitud no coincide con la operación original.", 409);
    return old.result as { id: string };
  }
  const result = await work();
  await tx.operation.create({ data: { key, userId, kind, fingerprint, result } });
  return result;
}
