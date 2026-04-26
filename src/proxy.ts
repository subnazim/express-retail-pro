import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { isAllowed } from "@/lib/access";

const PUBLIC_PATHS = ["/login", "/api/auth"];
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-me",
);

async function readRole(token: string): Promise<UserRole | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role;
    if (
      role === "ADMIN" ||
      role === "MANAGER" ||
      role === "CASHIER" ||
      role === "ACCOUNTANT"
    ) {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }
  const session = req.cookies.get("erp_session");
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  const role = await readRole(session.value);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete("erp_session");
    return res;
  }
  if (!isAllowed(role, pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("denied", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
