import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function money(value: number | string) { return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value)); }
export function sanitizeAuditValue<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  const blocked = /password|token|secret|api.?key|authorization/i;
  if (Array.isArray(value)) return value.map(sanitizeAuditValue) as T;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !blocked.test(key)).map(([key, item]) => [key, sanitizeAuditValue(item)])) as T;
}
