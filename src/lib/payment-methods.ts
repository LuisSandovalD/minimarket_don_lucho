export const PAYMENT_METHODS = ["CASH", "YAPE", "PLIN", "CARD", "TRANSFER", "CREDIT", "OTHER"] as const;

export const PAYMENT_LABELS: Record<string, string> = { CASH: "Efectivo", YAPE: "Yape", PLIN: "Plin", CARD: "Tarjeta", TRANSFER: "Transferencia", CREDIT: "Fiado", OTHER: "Otro" };
