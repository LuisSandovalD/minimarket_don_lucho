import { expect, it } from "vitest";
import { cashAmountSchema } from "./validation";
it.each(["-1", "NaN", "1.234", "Infinity", "1e5", ""]) ("rejects invalid cash amount %s", value => expect(cashAmountSchema.safeParse(value).success).toBe(false));
it.each(["0", "25", "25.50"]) ("accepts cash amount %s", value => expect(cashAmountSchema.safeParse(value).success).toBe(true));
