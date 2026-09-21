export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400, public details?: unknown) { super(message); }
}
export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; code: string; message: string; details?: unknown };
export function failure(error: unknown): ActionResult<never> {
  if (error instanceof AppError) return { success: false, code: error.code, message: error.message, details: error.details };
  console.error("Unhandled application error", error);
  return { success: false, code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." };
}
