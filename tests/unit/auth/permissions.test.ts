import { describe, expect, it } from "vitest";

import {
  assertCanAccessFarm,
  canAccessAllFarms,
  canAccessFarm,
  canManageUsers,
  getFarmAccessScope
} from "../../../src/server/auth/permissions";

describe("permission helpers", () => {
  it("allows only super admins to manage platform users", () => {
    expect(canManageUsers("SUPER_ADMIN")).toBe(true);
    expect(canManageUsers("LAND_OWNER")).toBe(false);
    expect(canManageUsers("TENANT_USER")).toBe(false);
  });

  it("allows only super admins to access every farm", () => {
    expect(canAccessAllFarms("SUPER_ADMIN")).toBe(true);
    expect(canAccessAllFarms("LAND_OWNER")).toBe(false);
    expect(canAccessAllFarms("TENANT_USER")).toBe(false);
  });

  it("restricts tenant users to assigned farms", () => {
    expect(canAccessFarm("TENANT_USER", ["farm_1"], "farm_1")).toBe(true);
    expect(canAccessFarm("TENANT_USER", ["farm_1"], "farm_2")).toBe(false);
  });

  it("builds an all-farms scope for privileged roles", () => {
    expect(getFarmAccessScope("SUPER_ADMIN", [])).toEqual({ type: "all" });
  });

  it("builds a deduplicated assigned-farms scope for tenant users", () => {
    expect(getFarmAccessScope("TENANT_USER", ["farm_1", "farm_1", "farm_2"])).toEqual({
      type: "assigned",
      farmIds: ["farm_1", "farm_2"]
    });
  });

  it("throws when farm access is denied", () => {
    expect(() => assertCanAccessFarm("TENANT_USER", ["farm_1"], "farm_2")).toThrow("You do not have access to this farm.");
  });
});
