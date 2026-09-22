import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { authorizeSale } from "./authorization";
import { saleSchema } from "./schemas";
const product = { id: "p", salePrice: new Prisma.Decimal("4.80"), allowsDiscount: true };
const data = () => saleSchema.parse({ idempotencyKey: "123e4567-e89b-42d3-a456-426614174000", customerId: "c", items: [{ productId: "p", quantity: 1, unitPrice: 4.8 }], payments: [{ method: "CASH", amount: 4.8, receivedAmount: 5 }] });
describe("sales authorization", () => {
  it("permits a normal sale", () => expect(() => authorizeSale(data(), ["sales.create"], [product])).not.toThrow());
  it("rejects price manipulation without permission", () => { const input = data(); input.items[0].unitPrice = 1; expect(() => authorizeSale(input, ["sales.create"], [product])).toThrow("sales.change_price"); });
  it("requires credit permission", () => { const input = data(); input.payments[0].method = "CREDIT"; expect(() => authorizeSale(input, ["sales.create"], [product])).toThrow("credits.create"); });
  it("rejects insufficient tender", () => { const input = data(); input.payments[0].receivedAmount = 1; expect(() => authorizeSale(input, ["sales.create"], [product])).toThrow("insuficiente"); });
  it("requires discount permission", () => { const input = data(); input.discount = 1; expect(() => authorizeSale(input, ["sales.create"], [product])).toThrow("sales.discount"); });
  it("rejects duplicate product lines", () => { const input = data(); input.items.push(input.items[0]); expect(saleSchema.safeParse(input).success).toBe(false); });
});
