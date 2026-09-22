import { NextResponse } from "next/server";
import { checkOrigin, apiError } from "@/lib/http";
import { saveCatalog } from "@/modules/admin/service";
export async function POST(request: Request, context: { params: Promise<{ kind: string }> }) { try { checkOrigin(request); const { kind } = await context.params; const { id, data } = await request.json(); return NextResponse.json({ success: true, data: await saveCatalog(kind, data, typeof id === "string" ? id : undefined) }); } catch (error) { return apiError(error); } }
