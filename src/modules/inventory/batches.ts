import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
export async function allocateBatches(tx: Prisma.TransactionClient, productId: string, saleItemId: string, quantity: Prisma.Decimal) {
  const day = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()) + "T00:00:00Z");
  const batches = await tx.productBatch.findMany({ where: { productId, quantity: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gte: day } }] }, orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { receivedAt: "asc" }] });
  let remaining = quantity;
  for (const batch of batches) {
    if (remaining.isZero()) break; const take = Prisma.Decimal.min(batch.quantity, remaining);
    await tx.productBatch.update({ where: { id: batch.id }, data: { quantity: { decrement: take } } });
    await tx.saleBatchAllocation.create({ data: { saleItemId, batchId: batch.id, quantity: take } }); remaining = remaining.minus(take);
  }
  if (remaining.greaterThan(0)) throw new AppError("BATCH_STOCK", "No hay cantidad suficiente en lotes vigentes.");
}
export async function restoreBatches(tx: Prisma.TransactionClient, saleItemId: string, quantity: Prisma.Decimal, previouslyRefunded = new Prisma.Decimal(0)) {
  const allocations = await tx.saleBatchAllocation.findMany({ where: { saleItemId }, orderBy: { id: "asc" } });
  let skip = previouslyRefunded, remaining = quantity;
  for (const allocation of allocations) {
    const ignored = Prisma.Decimal.min(skip, allocation.quantity); skip = skip.minus(ignored);
    const take = Prisma.Decimal.min(allocation.quantity.minus(ignored), remaining);
    if (take.greaterThan(0)) { await tx.productBatch.update({ where: { id: allocation.batchId }, data: { quantity: { increment: take } } }); remaining = remaining.minus(take); }
  }
  if (!remaining.isZero()) throw new AppError("BATCH_HISTORY", "El historial del lote no permite devolver esa cantidad.");
}
