import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOrigin, apiError } from "@/lib/http";
import { requirePermission, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
export async function POST(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  try {
    checkOrigin(request); const { kind: raw, id } = await context.params; const kind = z.enum(["products", "categories", "users", "business"]).parse(raw);
    const actor = await requireUser();
    if (kind === "users" && id !== actor.id) await requirePermission("users.update");
    if (kind !== "users") await requirePermission(kind === "business" ? "settings.update" : "products.update");
    if (kind === "business" && id !== "singleton") throw new AppError("NOT_FOUND", "Negocio inválido.", 404);
    const record = kind === "products" ? await db.product.findUniqueOrThrow({ where: { id } }) : kind === "categories" ? await db.productCategory.findUniqueOrThrow({ where: { id } }) : kind === "users" ? await db.user.findUniqueOrThrow({ where: { id } }) : await db.businessSettings.findUniqueOrThrow({ where: { id } });
    const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) throw new AppError("FILE", "Selecciona una imagen.");
    const uploaded = await uploadImage(file, kind);
    const old = "imagePublicId" in record ? record.imagePublicId : record.logoPublicId;
    try { await db.$transaction(async tx => {
      if (kind === "products") await tx.product.update({ where: { id }, data: uploaded });
      else if (kind === "categories") await tx.productCategory.update({ where: { id }, data: uploaded });
      else if (kind === "users") await tx.user.update({ where: { id }, data: uploaded });
      else await tx.businessSettings.update({ where: { id }, data: { logoUrl: uploaded.imageUrl, logoPublicId: uploaded.imagePublicId } });
      if (old) await tx.assetCleanup.upsert({ where: { publicId: old }, create: { publicId: old }, update: {} });
      await audit({ userId: actor.id, action: "CHANGE_IMAGE", module: kind, resource: kind, resourceId: id, before: { publicId: old }, after: uploaded }, tx);
    }); } catch (error) {
      try { await deleteImage(uploaded.imagePublicId); } catch { await db.assetCleanup.upsert({ where: { publicId: uploaded.imagePublicId }, create: { publicId: uploaded.imagePublicId }, update: {} }); }
      throw error;
    }
    if (old) { try { await deleteImage(old); await db.assetCleanup.deleteMany({ where: { publicId: old } }); } catch { /* Persistent cleanup queue retains the failed deletion. */ } }
    return NextResponse.json({ success: true, data: uploaded });
  } catch (error) { return apiError(error); }
}
