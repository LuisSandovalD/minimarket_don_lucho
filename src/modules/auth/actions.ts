"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSession, createToken, destroySession, hashPassword, hashToken, verifyPassword } from "@/lib/auth";
import { failure, type ActionResult, AppError } from "@/lib/errors";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { forgotSchema, loginSchema, resetSchema } from "./schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const invalidLogin = { success: false, code: "INVALID_CREDENTIALS", message: "Correo o contraseña incorrectos." } as const;

export async function loginAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const input = loginSchema.parse(Object.fromEntries(formData));
    const address = await clientIp();
    await Promise.all([rateLimit("login-account", input.email, 10, 900), rateLimit("login-ip", address, 30, 900)]);
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active || user.deletedAt) {
      await audit({ userId: user?.id, action: "LOGIN_FAILED", module: "auth", resource: "Session", metadata: { email: input.email, reason: "invalid-account" } });
      return invalidLogin;
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await audit({ userId: user.id, action: "LOGIN_BLOCKED", module: "auth", resource: "Session", metadata: { email: input.email } });
      return invalidLogin;
    }
    if (!await verifyPassword(user.passwordHash, input.password)) {
      const attempts = user.failedLoginCount + 1;
      await db.user.update({ where: { id: user.id }, data: { failedLoginCount: attempts >= 5 ? 0 : attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60000) : null } });
      await audit({ userId: user.id, action: "LOGIN_FAILED", module: "auth", resource: "Session", metadata: { email: input.email, attempt: Math.min(attempts, 5) } });
      return invalidLogin;
    }
    await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
    await createSession(user.id);
    await audit({ userId: user.id, action: "LOGIN", module: "auth", resource: "Session" });
  } catch (error) { return failure(error); }
  redirect("/dashboard");
}

export async function logoutAction() { await destroySession(); redirect("/login"); }

export async function forgotPasswordAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const { email } = forgotSchema.parse(Object.fromEntries(formData));
    const address = await clientIp();
    await Promise.all([rateLimit("forgot-account", email, 3, 3600), rateLimit("forgot-ip", address, 10, 3600)]);
    const user = await db.user.findUnique({ where: { email } });
    if (user?.active && !user.deletedAt) {
      await db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
      const token = createToken();
      await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600000) } });
      const url = new URL("/reset-password", env().APP_URL); url.searchParams.set("token", token);
      await sendEmail(email, "Recupera tu contraseña", `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${url.toString()}">Crear nueva contraseña</a></p><p>Este enlace vence en una hora.</p>`);
      await audit({ userId: user.id, action: "PASSWORD_RESET_REQUESTED", module: "auth", resource: "PasswordResetToken" });
    }
    return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}

export async function resetPasswordAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const input = resetSchema.parse(Object.fromEntries(formData));
    const tokenHash = hashToken(input.token);
    const address = await clientIp();
    await Promise.all([rateLimit("reset-token", tokenHash, 10, 900), rateLimit("reset-ip", address, 30, 900)]);
    const token = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!token || token.usedAt || token.expiresAt <= new Date()) return { success: false, code: "INVALID_TOKEN", message: "El enlace es inválido o venció." };
    const passwordHash = await hashPassword(input.password);
    await db.$transaction(async tx => {
      const consumed = await tx.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (consumed.count !== 1) throw new AppError("INVALID_TOKEN", "El enlace ya no es válido.");
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } });
      await tx.passwordResetToken.updateMany({ where: { userId: token.userId, usedAt: null }, data: { usedAt: new Date() } });
      await tx.session.deleteMany({ where: { userId: token.userId } });
    });
    await audit({ userId: token.userId, action: "PASSWORD_RESET", module: "auth", resource: "User", resourceId: token.userId });
    return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}
