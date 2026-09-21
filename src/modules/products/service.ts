import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { nextSequence } from "@/lib/sequence";
import { productSchema } from "./schemas";

export async function createProduct(raw: unknown, userId: string) {
  const input = productSchema.parse(raw);
  return db.$transaction(async tx => {
    const settings = await tx.businessSettings.upsert({ where: { id: "singleton" }, create: {}, update: {} });
    const sku = input.sku || await nextSequence(tx, "sku", settings.skuPrefix);
    const duplicate = await tx.product.findFirst({
      where: { OR: [{ sku }, ...(input.barcode ? [{ barcodes: { some: { code: input.barcode } } }] : [])] }
    });
    if (duplicate) throw new AppError("DUPLICATE_PRODUCT_CODE", "El SKU o código de barras ya está registrado.", 409);
    const stock = new Prisma.Decimal(input.stock); const product = await tx.product.create({ data: { sku, qrCode: sku, name: input.name, shortName: input.shortName || null, description: input.description || null, categoryId: input.categoryId || null, brandId: input.brandId || null, unitOfMeasureId: input.unitOfMeasureId, saleType: input.saleType, purchasePrice: input.purchasePrice, lastCost: input.purchasePrice, averageCost: input.purchasePrice, salePrice: input.salePrice, wholesalePrice: input.wholesalePrice || null, stock, minimumStock: input.minimumStock, allowsDecimals: input.allowsDecimals, allowsDiscount: input.allowsDiscount, allowsNegativeStock: input.allowsNegativeStock, tracksExpiration: input.tracksExpiration, barcodes: input.barcode ? { create: { code: input.barcode, type: "CUSTOM", primary: true } } : undefined } });
    if (!stock.isZero()) await tx.inventoryMovement.create({ data: { productId: product.id, previousStock: 0, quantity: stock, resultingStock: stock, unitCost: product.averageCost, type: "INITIAL_STOCK", referenceType: "PRODUCT", referenceId: product.id, userId } });
    await audit({ userId, action: "CREATE", module: "products", resource: "Product", resourceId: product.id, after: product }, tx);
    return product;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateProductPrice(productId: string, newPrice: string, reason: string, userId: string) {
  return db.$transaction(async tx => {
    const before = await tx.product.findUnique({ where: { id: productId } }); if (!before) throw new AppError("NOT_FOUND", "Producto no encontrado.", 404);
    const price = new Prisma.Decimal(newPrice); if (price.isNegative()) throw new AppError("INVALID_PRICE", "El precio no puede ser negativo.");
    const product = await tx.product.update({ where: { id: productId }, data: { salePrice: price } });
    await tx.productPriceHistory.create({ data: { productId, oldPrice: before.salePrice, newPrice: price, reason, userId } });
    await audit({ userId, action: "CHANGE_PRICE", module: "products", resource: "Product", resourceId: productId, before: { salePrice: before.salePrice.toString() }, after: { salePrice: price.toString() }, metadata: { reason } }, tx);
    return product;
  });
}
