import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { saleSchema } from "./schemas";
import type { z } from "zod";

export function authorizeSale(input: z.infer<typeof saleSchema>, permissions: string[], products: { id: string; salePrice: Prisma.Decimal; allowsDiscount: boolean }[]) {
  const demand = (permission: string) => {
    if (!permissions.includes(permission)) throw new AppError("FORBIDDEN", `Se requiere permiso: ${permission}.`, 403);
  };
  demand("sales.create");
  if (input.discount > 0) demand("sales.discount");
  if (input.payments.some(payment => payment.method === "CREDIT")) demand("credits.create");
  for (const item of input.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new AppError("PRODUCT_NOT_FOUND", "Producto no disponible.", 404);
    if (!product.salePrice.equals(item.unitPrice)) demand("sales.change_price");
    if (item.discount > 0 || input.discount > 0) {
      demand("sales.discount");
      if (!product.allowsDiscount) throw new AppError("DISCOUNT_NOT_ALLOWED", "El producto no admite descuentos.");
    }
    if (new Prisma.Decimal(item.unitPrice).mul(item.quantity).lessThan(item.discount)) throw new AppError("INVALID_DISCOUNT", "El descuento supera el importe de la línea.");
  }
  for (const payment of input.payments) {
    if (payment.method === "CASH" && (payment.receivedAmount === undefined || new Prisma.Decimal(payment.receivedAmount).lessThan(payment.amount))) throw new AppError("INSUFFICIENT_CASH", "El efectivo recibido es insuficiente.");
  }
}
