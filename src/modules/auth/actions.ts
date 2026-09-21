"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSession, createToken, destroySession, hashPassword, hashToken, verifyPassword } from "@/lib/auth";
import { failure, type ActionResult } from "@/lib/errors";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { forgotSchema, loginSchema, resetSchema } from "./schemas";

export async function loginAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const input = loginSchema.parse(Object.fromEntries(formData));
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active || user.deletedAt || user.lockedUntil && user.lockedUntil > new Date() || !await verifyPassword(user.passwordHash, input.password)) {
      if (user) { const attempts = user.failedLoginCount + 1; await db.user.update({ where: { id: user.id }, data: { failedLoginCount: attempts >= 5 ? 0 : attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60000) : undefined } }); }
      await audit({ userId: user?.id, action: "LOGIN_FAILED", module: "auth", resource: "Session", metadata: { email: input.email } });
      return { success: false, code: "INVALID_CREDENTIALS", message: "Correo o contraseña incorrectos." };
    }
    await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
    await createSession(user.id); await audit({ userId: user.id, action: "LOGIN", module: "auth", resource: "Session" });
  } catch (error) { return failure(error); }
  redirect("/dashboard");
}

export async function logoutAction() { await destroySession(); redirect("/login"); }

export async function forgotPasswordAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const { email } = forgotSchema.parse(Object.fromEntries(formData)); const user = await db.user.findUnique({ where: { email } });
    if (user?.active) { const token = createToken(); await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600000) } }); const url = `${env().APP_URL}/reset-password?token=${encodeURIComponent(token)}`; await sendEmail(email, "Recupera tu contraseña", `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${url}">Crear nueva contraseña</a></p><p>Este enlace vence en una hora.</p>`); await audit({ userId: user.id, action: "PASSWORD_RESET_REQUESTED", module: "auth", resource: "PasswordResetToken" }); }
    return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}

export async function resetPasswordAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const input = resetSchema.parse(Object.fromEntries(formData)); const token = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } });
    if (!token || token.usedAt || token.expiresAt <= new Date()) return { success: false, code: "INVALID_TOKEN", message: "El enlace es inválido o venció." };
    const passwordHash = await hashPassword(input.password);
    await db.$transaction(async tx => { await tx.user.update({ where: { id: token.userId }, data: { passwordHash } }); await tx.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }); await tx.session.deleteMany({ where: { userId: token.userId } }); });
    await audit({ userId: token.userId, action: "PASSWORD_RESET", module: "auth", resource: "User", resourceId: token.userId });
    return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}
