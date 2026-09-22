import { z } from "zod";
const amount = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/).refine(v => Number(v) > 0, "El monto debe ser mayor a cero.");
const quantity = z.string().regex(/^\d{1,12}(\.\d{1,4})?$/).refine(v => Number(v) > 0);
const payment = z.enum(["CASH", "YAPE", "PLIN", "CARD", "TRANSFER", "OTHER"]);
const base = { key: z.uuid(), reason: z.string().trim().min(3).max(1000) };
export const operationSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("purchase"), supplierId: z.string().min(1), productId: z.string().min(1), quantity, amount, method: payment, batch: z.string().max(100).optional(), expiresAt: z.iso.date().optional() }),
  z.object({ ...base, kind: z.literal("credit-payment"), customerId: z.string().min(1), amount, method: payment }),
  z.object({ ...base, kind: z.literal("expense"), categoryId: z.string().min(1), amount, method: payment }),
  z.object({ ...base, kind: z.literal("withdrawal"), amount, method: z.literal("CASH") }),
  z.object({ ...base, kind: z.literal("deposit"), amount, method: payment }),
  z.object({ ...base, kind: z.literal("adjustment"), productId: z.string().min(1), quantity, direction: z.enum(["IN", "OUT"]), type: z.enum(["ADJUSTMENT", "LOSS", "DAMAGE", "EXPIRATION", "INTERNAL_USE"]) }),
  z.object({ ...base, kind: z.literal("cancel-sale"), saleId: z.string().min(1) }),
  z.object({ ...base, kind: z.literal("refund"), saleItemId: z.string().min(1), quantity, returnsStock: z.boolean(), method: payment })
]);
export const operationPermissions = { purchase: "purchases.create", "credit-payment": "credits.receive_payment", expense: "expenses.create", withdrawal: "cash.withdraw", deposit: "cash.adjust", adjustment: "inventory.adjust", "cancel-sale": "sales.cancel", refund: "sales.refund" } as const;
