import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/src/core/auth/session-cookie";

const protectedPrefixes = ["/dashboard", "/projects", "/planning", "/analysis", "/cutting", "/assembly", "/installation", "/logistics", "/reports", "/employees", "/tasks"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    if (!request.cookies.get(SESSION_COOKIE_NAME)?.value) {
      return NextResponse.redirect(new URL(`/auth?next=${encodeURIComponent(path)}`, request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
