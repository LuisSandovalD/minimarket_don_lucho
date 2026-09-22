import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { transact } from "@/lib/transaction";
import { allocateBatches } from "@/modules/inventory/batches";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { nextSequence } from "@/lib/sequence";
import { saleSchema } from "./schemas";
import { requirePermission } from "@/lib/auth";
import { authorizeSale } from "./authorization";

export async function createSale(raw: unknown, userId: string) {
  const actor = await requirePermission("sales.create");
  if (actor.id !== userId) throw new AppError("FORBIDDEN", "Usuario inválido.", 403);
  const input = saleSchema.parse(raw);
  const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return transact(async tx => {
    const repeated = await tx.sale.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (repeated) {
      if (repeated.userId !== userId || repeated.requestHash !== requestHash) throw new AppError("IDEMPOTENCY_CONFLICT", "La clave ya está en uso o cambió la solicitud.", 409);
      return repeated;
    }
    const cashSession = await tx.cashSession.findFirst({ where: { userId, status: "OPEN" } }); if (!cashSession) throw new AppError("CASH_NOT_OPEN", "Debes abrir caja antes de vender.", 409);
    const customer = await tx.customer.findUnique({ where: { id: input.customerId }, include: { credit: true } }); if (!customer || !customer.active) throw new AppError("CUSTOMER_NOT_FOUND", "Cliente no disponible.", 404);
    const products = await tx.product.findMany({ where: { id: { in: input.items.map(i => i.productId) }, active: true, deletedAt: null } }); if (products.length !== new Set(input.items.map(i => i.productId)).size) throw new AppError("PRODUCT_NOT_FOUND", "Uno o más productos no están disponibles.", 404);
    authorizeSale(input, actor.permissions, products);
    for (const item of input.items) {
      const p = products.find(p => p.id === item.productId)!;
      if (p.stock.lessThan(item.quantity) && p.allowsNegativeStock && !actor.permissions.includes("inventory.sell_negative")) throw new AppError("NEGATIVE_STOCK_PERMISSION", "No tienes autorización para vender sin stock.", 403);
      if (new Prisma.Decimal(item.quantity).decimalPlaces() > 4 || new Prisma.Decimal(item.unitPrice).decimalPlaces() > 4) throw new AppError("PRECISION", "Se admiten hasta cuatro decimales.");
    }
    let subtotal = new Prisma.Decimal(0); const itemData = input.items.map(item => { const product = products.find(p => p.id === item.productId)!; const quantity = new Prisma.Decimal(item.quantity); if (!product.allowsDecimals && !quantity.isInteger()) throw new AppError("DECIMALS_NOT_ALLOWED", `${product.name} no admite cantidades decimales.`); if (!product.allowsNegativeStock && product.stock.lessThan(quantity)) throw new AppError("INSUFFICIENT_STOCK", `Stock insuficiente para ${product.name}.`, 409); const lineSubtotal = new Prisma.Decimal(item.unitPrice).mul(quantity).minus(item.discount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP); subtotal = subtotal.plus(lineSubtotal); return { product, quantity, unitPrice: new Prisma.Decimal(item.unitPrice), discount: new Prisma.Decimal(item.discount), subtotal: lineSubtotal }; });
    const total = subtotal.minus(input.discount); const paid = input.payments.filter(p => p.method !== "CREDIT").reduce((sum,p) => sum.plus(p.amount), new Prisma.Decimal(0)); const creditAmount = input.payments.filter(p => p.method === "CREDIT").reduce((sum,p) => sum.plus(p.amount), new Prisma.Decimal(0)); if (!paid.plus(creditAmount).equals(total)) throw new AppError("PAYMENT_MISMATCH", "La suma de pagos no coincide con el total."); if (creditAmount.greaterThan(0) && customer.general) throw new AppError("GENERAL_CUSTOMER_CREDIT", "No se puede fiar a Cliente General."); const currentDebt = customer.credit?.balance ?? new Prisma.Decimal(0); if (creditAmount.greaterThan(0) && currentDebt.plus(creditAmount).greaterThan(customer.creditLimit)) throw new AppError("CREDIT_LIMIT_EXCEEDED", "La operación excede el límite de crédito.", 409);
    const settings = await tx.businessSettings.findUnique({ where: { id: "singleton" } }); const code = await nextSequence(tx, "sale", settings?.salePrefix ?? "V");
    if (total.lessThanOrEqualTo(0) || total.decimalPlaces() > 2) throw new AppError("TOTAL", "El total debe ser positivo y tener hasta dos decimales.");
    for (const payment of input.payments) {
      if (new Prisma.Decimal(payment.amount).decimalPlaces() > 2) throw new AppError("PAYMENT_PRECISION", "El pago admite dos decimales.");
      if (settings?.requireDigitalReference && ["YAPE", "PLIN", "CARD", "TRANSFER"].includes(payment.method) && !payment.reference?.trim() && !payment.operationCode?.trim()) throw new AppError("PAYMENT_REFERENCE", "Ingresa una referencia del pago digital.");
    }
    const sale = await tx.sale.create({ data: { code, customerId: customer.id, userId, cashSessionId: cashSession.id, subtotal, discount: input.discount, total, paidAmount: paid, creditAmount, idempotencyKey: input.idempotencyKey, status: creditAmount.greaterThan(0) ? "CREDIT_PENDING" : "COMPLETED", items: { create: itemData.map(i => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.unitPrice, unitCost: i.product.averageCost, discount: i.discount, subtotal: i.subtotal })) }, payments: { create: input.payments.map(p => ({ method: p.method, amount: p.amount, receivedAmount: p.receivedAmount, changeAmount: p.method === "CASH" && p.receivedAmount ? new Prisma.Decimal(p.receivedAmount).minus(p.amount) : undefined, reference: p.reference, operationCode: p.operationCode })) } } });
    for (const item of itemData) { const updated = await tx.product.update({ where: { id: item.product.id }, data: { stock: { decrement: item.quantity } } }); await tx.inventoryMovement.create({ data: { productId: item.product.id, previousStock: item.product.stock, quantity: item.quantity.negated(), resultingStock: updated.stock, unitCost: item.product.averageCost, type: "SALE", referenceType: "SALE", referenceId: sale.id, userId } }); }
    for (const payment of input.payments.filter(p => p.method !== "CREDIT")) await tx.cashMovement.create({ data: { cashSessionId: cashSession.id, type: "SALE", amount: payment.amount, paymentMethod: payment.method, referenceType: "SALE", referenceId: sale.id, description: code, userId } });
    await tx.sale.update({ where: { id: sale.id }, data: { requestHash } });
    const savedItems = await tx.saleItem.findMany({ where: { saleId: sale.id } });
    for (const item of savedItems) if (products.find(p => p.id === item.productId)?.tracksExpiration) await allocateBatches(tx, item.productId, item.id, item.quantity);
    if (creditAmount.greaterThan(0)) { const credit = await tx.customerCredit.upsert({ where: { customerId: customer.id }, create: { customerId: customer.id, balance: creditAmount }, update: { balance: { increment: creditAmount } } }); await tx.creditMovement.create({ data: { creditId: credit.id, type: "CHARGE", amount: creditAmount, balanceAfter: credit.balance, referenceType: "SALE", referenceId: sale.id, userId } }); }
    await audit({ userId, action: "CREATE", module: "sales", resource: "Sale", resourceId: sale.id, after: { code, total: total.toString(), paid: paid.toString(), credit: creditAmount.toString() } }, tx); return sale;
  });
}
