import { NextResponse } from "next/server";
import { checkOrigin, apiError } from "@/lib/http";
import { executeOperation } from "@/modules/operations/service";
export async function POST(request: Request) { try { checkOrigin(request); return NextResponse.json({ success: true, data: await executeOperation(await request.json()) }); } catch (error) { return apiError(error); } }
