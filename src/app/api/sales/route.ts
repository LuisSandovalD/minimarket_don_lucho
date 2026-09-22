import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { checkOrigin, apiError } from "@/lib/http";
import { createSale } from "@/modules/sales/service";
export async function POST(request: Request) { try { checkOrigin(request); const user = await requirePermission("sales.create"); const sale = await createSale(await request.json(), user.id); return NextResponse.json({ success: true, data: { id: sale.id, code: sale.code } }, { status: 201 }); } catch (error) { return apiError(error); } }
