import { z } from "zod";

export const cashAmountSchema = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, "Ingresa un monto no negativo con hasta dos decimales.");
