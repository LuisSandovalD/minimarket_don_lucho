import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
export async function openCashSession(cashRegisterId: string, openingAmount: string, userId: string) {
  return db.$transaction(async tx => {
    const existing = await tx.cashSession.findFirst({ where: { userId, status: "OPEN" } }); if (existing) throw new AppError("CASH_ALREADY_OPEN", "Ya tienes una caja abierta.", 409);
    const session = await tx.cashSession.create({ data: { cashRegisterId, userId, openingAmount } });
    await audit({ userId, action: "OPEN", module: "cash", resource: "CashSession", resourceId: session.id, after: { openingAmount } }, tx); return session;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
export async function closeCashSession(sessionId: string, countedAmount: string, userId: string) {
  return db.$transaction(async tx => {
    const session = await tx.cashSession.findFirst({ where: { id: sessionId, userId, status: "OPEN" } }); if (!session) throw new AppError("CASH_NOT_OPEN", "No existe una caja abierta.", 409);
    const movements = await tx.cashMovement.aggregate({ where: { cashSessionId: sessionId }, _sum: { amount: true } }); const expected = session.openingAmount.plus(movements._sum.amount ?? 0); const counted = new Prisma.Decimal(countedAmount);
    const closed = await tx.cashSession.update({ where: { id: sessionId }, data: { status: "CLOSED", expectedAmount: expected, countedAmount: counted, difference: counted.minus(expected), closedAt: new Date() } });
    await audit({ userId, action: "CLOSE", module: "cash", resource: "CashSession", resourceId: sessionId, after: { expected: expected.toString(), counted: counted.toString(), difference: counted.minus(expected).toString() } }, tx); return closed;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
