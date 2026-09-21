import { type Prisma } from "@prisma/client";
export async function nextSequence(tx: Prisma.TransactionClient, key: string, prefix: string, length = 6) {
  const seq = await tx.sequence.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
  return `${prefix}-${seq.value.toString().padStart(length, "0")}`;
}
