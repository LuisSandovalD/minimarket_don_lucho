import { headers } from "next/headers";
import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { sanitizeAuditValue } from "@/lib/utils";
export async function audit(input: { userId?: string; action: string; module: string; resource: string; resourceId?: string; before?: unknown; after?: unknown; metadata?: unknown }, tx: Prisma.TransactionClient | typeof db = db) {
  const h = await headers();
  await tx.auditLog.create({ data: { ...input, before: input.before ? sanitizeAuditValue(input.before) as Prisma.InputJsonValue : undefined, after: input.after ? sanitizeAuditValue(input.after) as Prisma.InputJsonValue : undefined, metadata: input.metadata ? sanitizeAuditValue(input.metadata) as Prisma.InputJsonValue : undefined, ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(), userAgent: h.get("user-agent") } });
}
