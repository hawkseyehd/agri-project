import { describe, expect, it } from "vitest";

import { getSessionUser, shouldRefreshAuthToken } from "@/server/auth/auth";

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

  it("refreshes user data only after the auth refresh interval", () => {
    const now = Date.parse("2026-06-24T12:00:00.000Z");

    expect(shouldRefreshAuthToken(undefined, now)).toBe(true);
    expect(shouldRefreshAuthToken(now - 30_000, now)).toBe(false);
    expect(shouldRefreshAuthToken(now - 60_000, now)).toBe(true);
  });
});
