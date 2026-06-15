import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const pageByPath: Array<[RegExp, string]> = [
  [/^\/dashboard(?:\/|$)/, "DASHBOARD"],
  [/^\/farms(?:\/|$)/, "FARMS"],
  [/^\/land-blocks(?:\/|$)/, "LAND_BLOCKS"],
  [/^\/crop-seasons(?:\/|$)/, "CROP_SEASONS"],
  [/^\/daily-reports(?:\/|$)/, "DAILY_REPORTS"],
  [/^\/labor(?:\/|$)/, "LABOR"],
  [/^\/expenses(?:\/|$)/, "EXPENSES"],
  [/^\/inventory(?:\/|$)/, "INVENTORY"],
  [/^\/harvest-sales(?:\/|$)/, "HARVEST_SALES"],
  [/^\/yields(?:\/|$)/, "YIELDS"],
  [/^\/reports(?:\/|$)/, "REPORTS"]
];

function canViewPage(role: unknown, permissions: unknown, pathname: string) {
  if (role === "SUPER_ADMIN" || role === "LAND_OWNER" || role === "OWNER" || role === "ADMIN" || role === "MANAGER") {
    return true;
  }

  if (role !== "TENANT_USER") {
    return false;
  }

  const page = pageByPath.find(([pattern]) => pattern.test(pathname))?.[1];
  if (!page) {
    return true;
  }

  return Array.isArray(permissions) && permissions.some((permission) => {
    return typeof permission === "object" && permission !== null && "page" in permission && "canView" in permission && permission.page === page && permission.canView === true;
  });
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const subscriptionExpiresAt = req.nextauth.token?.subscriptionExpiresAt;
    const pathname = req.nextUrl.pathname;

    if (role === "PENDING_USER") {
      return NextResponse.redirect(new URL("/get-started", req.url));
    }

    if (role !== "SUPER_ADMIN" && typeof subscriptionExpiresAt === "string" && subscriptionExpiresAt && new Date(subscriptionExpiresAt) <= new Date()) {
      return NextResponse.redirect(new URL("/get-started", req.url));
    }

    if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!canViewPage(role, req.nextauth.token?.pagePermissions, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/farms/:path*",
    "/land-blocks/:path*",
    "/crop-seasons/:path*",
    "/daily-reports/:path*",
    "/labor/:path*",
    "/expenses/:path*",
    "/inventory/:path*",
    "/harvest-sales/:path*",
    "/yields/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/super-admin/:path*"
  ]
};
