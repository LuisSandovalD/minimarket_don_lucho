"use server";
import { db } from "@/lib/db";
import { createToken, hashToken, requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { failure, type ActionResult, AppError } from "@/lib/errors";
export async function requestVerification(): Promise<ActionResult> {
  try { const user = await requireUser(); await rateLimit("verify-request", user.id);
    const token = createToken();
    await db.emailVerificationToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86400000) } });
    const url = new URL("/verify", env().APP_URL); url.searchParams.set("token", token);
    await sendEmail(user.email, "Verifica tu correo", `<p><a href="${url.toString()}">Verificar correo</a></p>`);
    return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}
export async function verifyEmail(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try { const value = String(form.get("token") ?? ""); if (value.length < 32 || value.length > 128) throw new AppError("INVALID_TOKEN", "Enlace inválido.");
    const tokenHash = hashToken(value); await rateLimit("verify", tokenHash);
    await db.$transaction(async tx => {
      const token = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
      if (!token) throw new AppError("INVALID_TOKEN", "Enlace inválido.");
      const used = await tx.emailVerificationToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (!used.count) throw new AppError("INVALID_TOKEN", "Enlace usado o vencido.");
      await tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } });
      await audit({ userId: token.userId, action: "VERIFY_EMAIL", module: "auth", resource: "User", resourceId: token.userId }, tx);
    }); return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}
