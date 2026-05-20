import { describe, expect, it } from "vitest";

import {
  canAccessFarm,
  canAccessPackageUsers,
  canManageUsers,
  canOpenAppModules,
  canUsePagePermission,
  getPackageUserLimit
} from "../../src/server/auth/permissions";

describe("permission helpers", () => {
  it("allows only super admins to manage platform users", () => {
    expect(canManageUsers("SUPER_ADMIN")).toBe(true);
    expect(canManageUsers("LAND_OWNER")).toBe(false);
    expect(canManageUsers("TENANT_USER")).toBe(false);
    expect(canManageUsers("PENDING_USER")).toBe(false);
  });

  it("restricts tenant users and land owners to assigned farms", () => {
    expect(canAccessFarm("TENANT_USER", ["farm_1"], "farm_1")).toBe(true);
    expect(canAccessFarm("TENANT_USER", ["farm_1"], "farm_2")).toBe(false);
    expect(canAccessFarm("LAND_OWNER", ["farm_1"], "farm_1")).toBe(true);
    expect(canAccessFarm("LAND_OWNER", ["farm_1"], "farm_2")).toBe(false);
  });

  it("allows super admins to access any farm", () => {
    expect(canAccessFarm("SUPER_ADMIN", [], "farm_1")).toBe(true);
  });

  it("blocks pending users from app modules", () => {
    expect(canOpenAppModules("PENDING_USER")).toBe(false);
    expect(canOpenAppModules("LAND_OWNER")).toBe(true);
  });

  it("enforces package user limits", () => {
    expect(getPackageUserLimit("NONE")).toBe(0);
    expect(getPackageUserLimit("SILVER")).toBe(0);
    expect(getPackageUserLimit("GOLD")).toBe(3);
    expect(getPackageUserLimit("PLATINUM")).toBe(5);
  });

  it("allows package user management only for gold, platinum, and super admin", () => {
    expect(canAccessPackageUsers("SUPER_ADMIN", "NONE")).toBe(true);
    expect(canAccessPackageUsers("LAND_OWNER", "SILVER")).toBe(false);
    expect(canAccessPackageUsers("LAND_OWNER", "GOLD")).toBe(true);
    expect(canAccessPackageUsers("LAND_OWNER", "PLATINUM")).toBe(true);
  });

  it("enforces tenant user page permissions by action", () => {
    const permissions = [
      {
        page: "FARMS",
        canView: true,
        canCreate: false,
        canEdit: true,
        canDelete: false
      }
    ];

    expect(canUsePagePermission("TENANT_USER", permissions, "FARMS", "view")).toBe(true);
    expect(canUsePagePermission("TENANT_USER", permissions, "FARMS", "create")).toBe(false);
    expect(canUsePagePermission("TENANT_USER", permissions, "FARMS", "edit")).toBe(true);
    expect(canUsePagePermission("TENANT_USER", permissions, "FARMS", "delete")).toBe(false);
    expect(canUsePagePermission("TENANT_USER", permissions, "REPORTS", "view")).toBe(false);
  });

  it("lets land owners bypass tenant page permissions", () => {
    expect(canUsePagePermission("LAND_OWNER", [], "FARMS", "delete")).toBe(true);
  });
});
