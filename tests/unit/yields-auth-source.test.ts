import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const middleware = readFileSync(join(process.cwd(), "src", "middleware.ts"), "utf8");
const yieldsPage = readFileSync(join(process.cwd(), "src", "app", "yields", "page.tsx"), "utf8");
const appShell = readFileSync(join(process.cwd(), "src", "components", "layout", "AppShell.tsx"), "utf8");

describe("yields authorization", () => {
  test("redirects the legacy yields route according to the authenticated role", () => {
    expect(yieldsPage).toContain('session?.user?.role === "SUPER_ADMIN"');
    expect(yieldsPage).toContain('redirect("/super-admin/yields")');
    expect(yieldsPage).toContain('redirect("/dashboard")');
  });

  test("blocks non-superadmins at middleware before rendering the yields route", () => {
    expect(middleware).toContain('pathname.startsWith("/yields") && role !== "SUPER_ADMIN"');
    expect(middleware).toContain('NextResponse.redirect(new URL("/dashboard", req.url))');
  });

  test("offers yields navigation only in the superadmin sidebar", () => {
    expect(appShell).not.toContain('{ href: "/yields", label: "Yields"');
    expect(appShell).toContain('{ href: "/super-admin/yields", label: "Yields"');
  });
});
