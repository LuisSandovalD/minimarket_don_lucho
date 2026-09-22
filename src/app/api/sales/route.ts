import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
<<<<<<< HEAD
import { checkOrigin, apiError } from "@/lib/http";
import { createSale } from "@/modules/sales/service";
export async function POST(request: Request) { try { checkOrigin(request); const user = await requirePermission("sales.create"); const sale = await createSale(await request.json(), user.id); return NextResponse.json({ success: true, data: { id: sale.id, code: sale.code } }, { status: 201 }); } catch (error) { return apiError(error); } }
=======
import { AppError } from "@/lib/errors";
import { createSale } from "@/modules/sales/service";
export async function POST(request: Request) { try { const user = await requirePermission("sales.create"); const sale = await createSale(await request.json(), user.id); return NextResponse.json({ success: true, data: { id: sale.id, code: sale.code } }, { status: 201 }); } catch (error) { const e = error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "Ocurrió un error inesperado.", 500); return NextResponse.json({ success: false, code: e.code, message: e.message }, { status: e.status }); } }
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
