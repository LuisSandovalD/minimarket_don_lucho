import { z } from "zod";
const decimal = z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^\d+(\.\d{1,4})?$/));
export const productSchema = z.object({
  sku: z.string().trim().max(40).optional(), name: z.string().trim().min(2).max(180), shortName: z.string().trim().max(80).optional(), description: z.string().trim().max(2000).optional(),
  categoryId: z.string().optional(), brandId: z.string().optional(), unitOfMeasureId: z.string().min(1), saleType: z.enum(["QUANTITY", "WEIGHT", "VOLUME", "OTHER"]),
  barcode: z.string().trim().max(80).optional(), purchasePrice: decimal, salePrice: decimal, wholesalePrice: decimal.optional(), stock: decimal.default("0"), minimumStock: decimal.default("0"),
  allowsDecimals: z.coerce.boolean().default(false), allowsDiscount: z.coerce.boolean().default(true), allowsNegativeStock: z.coerce.boolean().default(false), tracksExpiration: z.coerce.boolean().default(false)
});
