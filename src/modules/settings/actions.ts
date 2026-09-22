"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { failure, type ActionResult } from "@/lib/errors";
const schema = z.object({ businessName: z.string().trim().min(2).max(180), ruc: z.string().regex(/^\d{11}$/).or(z.literal("")), address: z.string().max(300), phone: z.string().max(30), skuPrefix: z.string().regex(/^[A-Z0-9]{1,10}$/), salePrefix: z.string().regex(/^[A-Z0-9]{1,10}$/), taxRate: z.coerce.number().min(0).max(100), defaultMinimumStock: z.coerce.number().min(0), expirationAlertDays: z.coerce.number().int().min(1).max(365), ticketWidth: z.enum(["58", "80"]).transform(Number), requireDigitalReference: z.enum(["true", "false"]).transform(v => v === "true") });
export async function saveSettings(_: ActionResult | null, form: FormData): Promise<ActionResult> { try { const actor = await requirePermission("settings.update"); const data = schema.parse(Object.fromEntries(form)); await db.$transaction(async tx => { const before = await tx.businessSettings.findUnique({ where: { id: "singleton" } }); const after = await tx.businessSettings.upsert({ where: { id: "singleton" }, create: data, update: data }); await audit({ userId: actor.id, action: "UPDATE", module: "settings", resource: "BusinessSettings", resourceId: "singleton", before, after }, tx); }); revalidatePath("/settings"); return { success: true, data: undefined }; } catch (error) { return failure(error); } }
