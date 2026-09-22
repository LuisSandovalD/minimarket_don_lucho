"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { failure, type ActionResult } from "@/lib/errors";
import { closeCashSession, openCashSession } from "./service";
export async function openCashAction(_:ActionResult|null,formData:FormData):Promise<ActionResult>{try{const user=await requirePermission("cash.open");await openCashSession(String(formData.get("cashRegisterId")),String(formData.get("openingAmount")),user.id);revalidatePath("/cash");return{success:true,data:undefined}}catch(error){return failure(error)}}
export async function closeCashAction(_:ActionResult|null,formData:FormData):Promise<ActionResult>{try{const user=await requirePermission("cash.close");await closeCashSession(String(formData.get("sessionId")),String(formData.get("countedAmount")),user.id);revalidatePath("/cash");return{success:true,data:undefined}}catch(error){return failure(error)}}
