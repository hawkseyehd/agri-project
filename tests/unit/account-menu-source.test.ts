import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const appShell = readFileSync(join(process.cwd(), "src", "components", "layout", "AppShell.tsx"), "utf8");
const dashboardPage = readFileSync(join(process.cwd(), "src", "app", "dashboard", "page.tsx"), "utf8");

describe("account menu placement", () => {
  test("shows sign in instead of the account icon for guests", () => {
    expect(appShell).toContain("!session");
    expect(appShell).toContain('href="/login"');
    expect(appShell).toContain("Sign in");
  });

  test("keeps logged-in account actions in the top-right dropdown", () => {
    expect(appShell).toContain("Profile settings");
    expect(appShell).toContain("Change password");
    expect(appShell).toContain("Company settings");
    expect(appShell).toContain("Workspace");
    expect(appShell).toContain("Sign out");
    expect(appShell).toContain('href="/api/auth/signout"');
  });

  test("removes profile and user-management entries from the sidebar", () => {
    expect(appShell).not.toContain('href: "/settings", label: "Settings"');
    expect(appShell).not.toContain('href: "/settings", label: "Users"');
  });

  test("places land blocks immediately after farms and land in the sidebar", () => {
    const farmsIndex = appShell.indexOf('label: "Farms & Land"');
    const landBlocksIndex = appShell.indexOf('label: "Land Blocks"');
    const cropSeasonsIndex = appShell.indexOf('label: "Crop Seasons"');

    expect(farmsIndex).toBeGreaterThan(-1);
    expect(landBlocksIndex).toBeGreaterThan(farmsIndex);
    expect(cropSeasonsIndex).toBeGreaterThan(landBlocksIndex);
  });

  test("places user management on the dashboard for eligible users", () => {
    expect(dashboardPage).toContain("canAccessPackageUsers");
    expect(dashboardPage).toContain("User Management");
    expect(dashboardPage).toContain("CreateManagerForm");
    expect(dashboardPage).toContain("AssignManagerForm");
    expect(dashboardPage).toContain("UserPermissionsForms");
  });
});
