import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

const COOKIE = "mdl_session";
const DAYS = 7;
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const createToken = () => randomBytes(32).toString("base64url");
export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

export async function createSession(userId: string) {
  const token = createToken();
  const headerStore = await headers();
  const expiresAt = new Date(Date.now() + DAYS * 86400000);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt, ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim(), userAgent: headerStore.get("user-agent") } });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(COOKIE);
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } } });
  if (!session || session.expiresAt <= new Date() || !session.user.active || session.user.deletedAt) return null;
  const permissions = [...new Set(session.user.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key)))];
  return { id: session.user.id, name: session.user.name, email: session.user.email, imageUrl: session.user.imageUrl, roles: session.user.roles.map(({ role }) => role.name), permissions };
}

export async function requireUser() { const user = await getSessionUser(); if (!user) throw new AppError("UNAUTHORIZED", "Debes iniciar sesión.", 401); return user; }
export async function requirePermission(permission: string) {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) throw new AppError("FORBIDDEN", "No tienes permiso para realizar esta acción.", 403);
  return user;
}
