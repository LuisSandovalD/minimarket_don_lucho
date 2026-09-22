import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { nextSequence } from "@/lib/sequence";
import { once, transact } from "@/lib/transaction";
import { operationPermissions, operationSchema } from "./schemas";
import { restoreBatches } from "@/modules/inventory/batches";

export async function executeOperation(raw: unknown) {
  const input = operationSchema.parse(raw);
  const user = await requirePermission(operationPermissions[input.kind]);
  if (input.kind === "adjustment" && input.type !== "ADJUSTMENT") await requirePermission("inventory.register_loss");
  return transact(tx => once(tx, input.key, user.id, input.kind, input, async () => {
    const cash = input.kind !== "adjustment" ? await tx.cashSession.findFirst({ where: { userId: user.id, status: "OPEN" } }) : null;
    if (input.kind !== "adjustment" && !cash) throw new AppError("CASH_NOT_OPEN", "Abre caja para registrar la operación.");
    const cashMovement = async (type: "EXPENSE" | "WITHDRAWAL" | "DEPOSIT" | "CREDIT_PAYMENT" | "REFUND", amount: Prisma.Decimal, method: "CASH" | "YAPE" | "PLIN" | "CARD" | "TRANSFER" | "OTHER", referenceId: string) => tx.cashMovement.create({ data: { cashSessionId: cash!.id, type, amount, paymentMethod: method, referenceType: input.kind, referenceId, description: input.reason, userId: user.id } });
    let id: string;
    if (input.kind === "purchase" || input.kind === "adjustment") {
      const p = await tx.product.findFirst({ where: { id: input.productId, active: true, deletedAt: null } });
      if (!p) throw new AppError("NOT_FOUND", "Producto no disponible.", 404);
      const qty = new Prisma.Decimal(input.quantity);
      if (!p.allowsDecimals && !qty.isInteger()) throw new AppError("QUANTITY", "La unidad no admite decimales.");
      const delta = input.kind === "adjustment" && input.direction === "OUT" ? qty.negated() : qty;
      const next = p.stock.plus(delta);
      if (next.isNegative()) throw new AppError("STOCK", "El movimiento dejaría stock negativo.");
      let cost = p.averageCost;
      if (input.kind === "purchase") {
        const supplier = await tx.supplier.findFirst({ where: { id: input.supplierId, active: true, deletedAt: null } });
        if (!supplier) throw new AppError("SUPPLIER", "Proveedor no disponible.");
        if (p.tracksExpiration && (!input.batch || !input.expiresAt)) throw new AppError("BATCH", "El producto requiere lote y vencimiento.");
        const unitCost = new Prisma.Decimal(input.amount), total = unitCost.mul(qty).toDecimalPlaces(2);
        const purchase = await tx.purchase.create({ data: { code: await nextSequence(tx, "purchase", "C"), supplierId: supplier.id, purchasedAt: new Date(), subtotal: total, total, paymentMethod: input.method, status: "CONFIRMED", userId: user.id, items: { create: { productId: p.id, quantity: qty, unitCost, subtotal: total, batchNumber: input.batch, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } } } });
        id = purchase.id;
        cost = p.stock.greaterThan(0) ? p.stock.mul(p.averageCost).plus(qty.mul(unitCost)).div(next).toDecimalPlaces(4) : unitCost;
        await tx.product.update({ where: { id: p.id }, data: { stock: next, averageCost: cost, lastCost: unitCost, purchasePrice: unitCost } });
        if (input.batch) {
          const prior = await tx.productBatch.findUnique({ where: { productId_batchNumber: { productId: p.id, batchNumber: input.batch } } });
          if (prior && prior.expiresAt?.toISOString().slice(0,10) !== input.expiresAt) throw new AppError("BATCH_CONFLICT", "El lote tiene otro vencimiento.");
          await tx.productBatch.upsert({ where: { productId_batchNumber: { productId: p.id, batchNumber: input.batch } }, create: { productId: p.id, batchNumber: input.batch, quantity: qty, cost: unitCost, receivedAt: new Date(), expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }, update: { quantity: { increment: qty } } });
        }
        await cashMovement("EXPENSE", total.negated(), input.method, id);
      } else {
        if (p.tracksExpiration) throw new AppError("BATCH_REQUIRED", "Ajusta el lote específico del producto con vencimiento.");
        await tx.product.update({ where: { id: p.id }, data: { stock: next } }); id = p.id;
      }
      await tx.inventoryMovement.create({ data: { productId: p.id, previousStock: p.stock, quantity: delta, resultingStock: next, unitCost: cost, type: input.kind === "purchase" ? "PURCHASE" : input.type, referenceType: input.kind, referenceId: id, reason: input.reason, userId: user.id } });
    } else if (input.kind === "credit-payment") {
      const credit = await tx.customerCredit.findUnique({ where: { customerId: input.customerId } });
      const amount = new Prisma.Decimal(input.amount);
      if (!credit || credit.balance.lessThan(amount)) throw new AppError("PAYMENT", "El abono supera la deuda pendiente.");
      const payment = await tx.creditPayment.create({ data: { creditId: credit.id, amount, paymentMethod: input.method, cashSessionId: cash!.id, reference: input.reason } }); id = payment.id;
      let unallocated = amount;
      const debts = await tx.sale.findMany({ where: { customerId: input.customerId, creditAmount: { gt: 0 }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, include: { creditAllocations: true, refunds: true }, orderBy: { createdAt: "asc" } });
      for (const debt of debts) {
        const settled = debt.creditAllocations.reduce((sum, a) => sum.plus(a.amount), new Prisma.Decimal(0));
        const reversed = debt.refunds.reduce((sum, r) => sum.plus(r.creditAmount), new Prisma.Decimal(0));
        const due = Prisma.Decimal.max(0, debt.creditAmount.minus(settled).minus(reversed));
        const portion = Prisma.Decimal.min(due, unallocated);
        if (portion.greaterThan(0)) {
          await tx.creditPaymentAllocation.create({ data: { paymentId: id, saleId: debt.id, amount: portion } }); unallocated = unallocated.minus(portion);
          if (due.equals(portion) && debt.status === "CREDIT_PENDING") await tx.sale.update({ where: { id: debt.id }, data: { status: "CREDIT_PAID" } });
        }
      }
      if (!unallocated.isZero()) throw new AppError("CREDIT_HISTORY", "La cuenta requiere conciliar su historial antes de aceptar este abono.");
      const after = await tx.customerCredit.update({ where: { id: credit.id }, data: { balance: { decrement: amount } } });
      await tx.creditMovement.create({ data: { creditId: credit.id, type: "PAYMENT", amount: amount.negated(), balanceAfter: after.balance, referenceType: "CreditPayment", referenceId: id, notes: input.reason, userId: user.id } });
      await cashMovement("CREDIT_PAYMENT", amount, input.method, id);
    } else if (input.kind === "expense") {
      const category = await tx.expenseCategory.findFirst({ where: { id: input.categoryId, active: true } }); if (!category) throw new AppError("CATEGORY", "Categoría inválida.");
      const expense = await tx.expense.create({ data: { code: await nextSequence(tx, "expense", "G"), categoryId: category.id, description: input.reason, amount: input.amount, paymentMethod: input.method, cashSessionId: cash!.id, userId: user.id } }); id = expense.id;
      await cashMovement("EXPENSE", new Prisma.Decimal(input.amount).negated(), input.method, id);
    } else if (input.kind === "withdrawal" || input.kind === "deposit") {
      const movement = await cashMovement(input.kind === "withdrawal" ? "WITHDRAWAL" : "DEPOSIT", new Prisma.Decimal(input.amount).mul(input.kind === "withdrawal" ? -1 : 1), input.method, input.key); id = movement.id;
    } else if (input.kind === "cancel-sale") {
      const sale = await tx.sale.findUnique({ where: { id: input.saleId }, include: { items: true, payments: true, refunds: true, creditAllocations: { include: { payment: true } } } });
      if (!sale || sale.status === "CANCELLED" || sale.refunds.length) throw new AppError("SALE_STATE", "Venta inexistente, anulada o con devoluciones.");
      const settled = sale.creditAllocations.reduce((sum, a) => sum.plus(a.amount), new Prisma.Decimal(0));
      const outstanding = sale.creditAmount.minus(settled);
      if (outstanding.greaterThan(0)) {
        const credit = await tx.customerCredit.update({ where: { customerId: sale.customerId }, data: { balance: { decrement: outstanding } } });
        if (credit.balance.isNegative()) throw new AppError("CREDIT_HISTORY", "La deuda no coincide con su historial.");
        await tx.creditMovement.create({ data: { creditId: credit.id, type: "CANCELLATION", amount: outstanding.negated(), balanceAfter: credit.balance, referenceType: "Sale", referenceId: sale.id, notes: input.reason, userId: user.id } });
      }
      for (const allocation of sale.creditAllocations) {
        if (allocation.payment.paymentMethod === "CREDIT") throw new AppError("PAYMENT_METHOD", "Método de abono inválido.");
        await cashMovement("REFUND", allocation.amount.negated(), allocation.payment.paymentMethod, sale.id);
      }
      for (const item of sale.items) {
        const p = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        if (p.tracksExpiration) await restoreBatches(tx, item.id, item.quantity);
        const next = p.stock.plus(item.quantity); await tx.product.update({ where: { id: p.id }, data: { stock: next } });
        await tx.inventoryMovement.create({ data: { productId: p.id, previousStock: p.stock, quantity: item.quantity, resultingStock: next, unitCost: item.unitCost, type: "CANCELLATION", referenceType: "Sale", referenceId: sale.id, reason: input.reason, userId: user.id } });
      }
      for (const payment of sale.payments) if (payment.method !== "CREDIT") await cashMovement("REFUND", payment.amount.negated(), payment.method, sale.id);
      await tx.sale.update({ where: { id: sale.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: input.reason } }); id = sale.id;
    } else {
      const item = await tx.saleItem.findUnique({ where: { id: input.saleItemId }, include: { sale: { include: { creditAllocations: true, refunds: true } }, refundItems: true, product: true } });
      if (!item || ["CANCELLED", "REFUNDED"].includes(item.sale.status)) throw new AppError("SALE_STATE", "La venta no admite devoluciones.");
      const returned = item.refundItems.reduce((sum, r) => sum.plus(r.quantity), new Prisma.Decimal(0)), qty = new Prisma.Decimal(input.quantity);
      if (returned.plus(qty).greaterThan(item.quantity)) throw new AppError("REFUND_QUANTITY", "La cantidad supera el saldo por devolver.");
      if (!item.product.allowsDecimals && !qty.isInteger()) throw new AppError("QUANTITY", "La unidad no admite decimales.");
      const originalLine = item.subtotal.mul(item.sale.total).div(item.sale.subtotal).toDecimalPlaces(2);
      const alreadyRefunded = item.refundItems.reduce((sum, r) => sum.plus(r.amount), new Prisma.Decimal(0));
      const amount = returned.plus(qty).equals(item.quantity) ? originalLine.minus(alreadyRefunded) : originalLine.mul(qty).div(item.quantity).toDecimalPlaces(2);
      const outstanding = item.sale.creditAmount.minus(item.sale.creditAllocations.reduce((sum,a) => sum.plus(a.amount), new Prisma.Decimal(0))).minus(item.sale.refunds.reduce((sum,r) => sum.plus(r.creditAmount), new Prisma.Decimal(0)));
      const creditAmount = Prisma.Decimal.min(amount, Prisma.Decimal.max(0, outstanding));
      const refund = await tx.saleRefund.create({ data: { code: await nextSequence(tx, "refund", "DEV"), saleId: item.saleId, amount, creditAmount, reason: input.reason, returnsStock: input.returnsStock, items: { create: { saleItemId: item.id, productId: item.productId, quantity: qty, amount } } } }); id = refund.id;
      if (creditAmount.greaterThan(0)) { const credit = await tx.customerCredit.update({ where: { customerId: item.sale.customerId }, data: { balance: { decrement: creditAmount } } }); await tx.creditMovement.create({ data: { creditId: credit.id, type: "CANCELLATION", amount: creditAmount.negated(), balanceAfter: credit.balance, referenceType: "SaleRefund", referenceId: id, notes: input.reason, userId: user.id } }); }
      if (input.returnsStock) {
        if (item.product.tracksExpiration) await restoreBatches(tx, item.id, qty, returned);
        const next = item.product.stock.plus(qty); await tx.product.update({ where: { id: item.productId }, data: { stock: next } });
        await tx.inventoryMovement.create({ data: { productId: item.productId, previousStock: item.product.stock, quantity: qty, resultingStock: next, unitCost: item.unitCost, type: "RETURN", referenceType: "SaleRefund", referenceId: id, reason: input.reason, userId: user.id } });
      }
      if (amount.greaterThan(creditAmount)) await cashMovement("REFUND", amount.minus(creditAmount).negated(), input.method, id);
      const all = await tx.saleItem.findMany({ where: { saleId: item.saleId }, include: { refundItems: true } });
      const full = all.every(i => i.refundItems.reduce((sum, r) => sum.plus(r.quantity), new Prisma.Decimal(0)).equals(i.quantity));
      await tx.sale.update({ where: { id: item.saleId }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    }
    await audit({ userId: user.id, action: input.kind, module: "operations", resource: input.kind, resourceId: id, after: input }, tx);
    return { id };
  }));
}
