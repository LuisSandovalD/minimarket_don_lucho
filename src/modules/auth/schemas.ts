import { z } from "zod";
export const loginSchema = z.object({ email: z.email().transform(v => v.trim().toLowerCase()), password: z.string().min(1).max(128) });
export const forgotSchema = z.object({ email: z.email().transform(v => v.trim().toLowerCase()) });
export const resetSchema = z.object({ token: z.string().min(32), password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/) });
