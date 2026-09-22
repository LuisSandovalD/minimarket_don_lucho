import { NextRequest, NextResponse } from "next/server";
const protectedPaths = ["/dashboard","/pos","/products","/inventory","/sales","/customers","/purchases","/cash","/reports","/audit","/settings","/users","/imports"];
export function proxy(request: NextRequest) { const protectedRoute = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path)); const hasSession = Boolean(request.cookies.get("mdl_session")?.value); if (protectedRoute && !hasSession) return NextResponse.redirect(new URL("/login", request.url)); return NextResponse.next(); }
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
