import { z } from "zod";
export const saleSchema = z.object({
  idempotencyKey: z.string().uuid(), customerId: z.string().min(1), discount: z.coerce.number().min(0).default(0),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().positive(), discount: z.coerce.number().min(0).default(0) })).min(1),
  payments: z.array(z.object({ method: z.enum(["CASH","YAPE","PLIN","CARD","TRANSFER","CREDIT","OTHER"]), amount: z.coerce.number().positive(), receivedAmount: z.coerce.number().optional(), reference: z.string().max(100).optional(), operationCode: z.string().max(100).optional() })).min(1)
});
