"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { failure, type ActionResult } from "@/lib/errors";
import { createProduct } from "./service";
export async function createProductAction(_: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  try { const user = await requirePermission("products.create"); const product = await createProduct(Object.fromEntries(formData), user.id); revalidatePath("/products"); return { success: true, data: { id: product.id } }; } catch (error) { return failure(error); }
}
