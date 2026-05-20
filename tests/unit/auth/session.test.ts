import { describe, expect, it } from "vitest";

import { getSessionUser } from "@/server/auth/auth";

describe("session helpers", () => {
  it("returns a normalized authenticated user from a complete session", () => {
    expect(
      getSessionUser({
        user: {
          id: "user_1",
          name: "Demo Manager",
          email: "manager@example.com",
          role: "TENANT_USER",
          packageTier: "NONE",
          companyName: "Demo Farms",
          ownerId: "owner_1",
          subscriptionApprovedAt: "2026-05-01T00:00:00.000Z",
          subscriptionExpiresAt: "2026-06-01T00:00:00.000Z",
          pagePermissions: [],
          assignedFarmIds: ["farm_1"]
        },
        expires: "2026-05-01T00:00:00.000Z"
      })
    ).toEqual({
      id: "user_1",
      name: "Demo Manager",
      email: "manager@example.com",
      role: "TENANT_USER",
      packageTier: "NONE",
      companyName: "Demo Farms",
      ownerId: "owner_1",
      subscriptionApprovedAt: "2026-05-01T00:00:00.000Z",
      subscriptionExpiresAt: "2026-06-01T00:00:00.000Z",
      pagePermissions: [],
      assignedFarmIds: ["farm_1"]
    });
  });

  it("returns null when the session is missing required auth fields", () => {
    expect(getSessionUser(null)).toBeNull();
    expect(getSessionUser({ user: { id: "", role: "TENANT_USER", packageTier: "NONE", pagePermissions: [], assignedFarmIds: [] }, expires: "" })).toBeNull();
  });
});
