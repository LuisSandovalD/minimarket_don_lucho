<<<<<<< HEAD
import { z } from "zod";
=======
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400, public details?: unknown) { super(message); }
}
export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; code: string; message: string; details?: unknown };
export function failure(error: unknown): ActionResult<never> {
<<<<<<< HEAD
  if (error instanceof z.ZodError) return { success: false, code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Datos inválidos." };
  if (error instanceof AppError) return { success: false, code: error.code, message: error.message, details: error.details };
  console.error("Unhandled application error", { name: error instanceof Error ? error.name : "Unknown" });
=======
  if (error instanceof AppError) return { success: false, code: error.code, message: error.message, details: error.details };
  console.error("Unhandled application error", error);
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
  return { success: false, code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." };
}
