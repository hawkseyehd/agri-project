import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  hash: vi.fn(async () => "hashed-password")
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mocks.hash
  }
}));

vi.mock("@/server/auth/auth", () => ({
  requireAuthUser: vi.fn(async () => ({
    id: "super_1",
    email: "super@example.com",
    name: "Super Admin",
    role: "SUPER_ADMIN",
    packageTier: "NONE",
    farmIds: [],
    pagePermissions: [],
    subscriptionExpiresAt: null
  }))
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      update: mocks.update,
      create: mocks.create,
      findUnique: mocks.findUnique
    }
  }
}));

import { createPlatformUserAction, updateUserAccessAction } from "../../src/server/actions/super-admin.actions";

describe("super admin actions", () => {
  beforeEach(() => {
    mocks.update.mockReset();
    mocks.create.mockReset();
    mocks.findUnique.mockReset();
    mocks.hash.mockClear();
  });

  it("requires an expiry date/time when approving a platform user", async () => {
    const formData = new FormData();
    formData.set("userId", "user_1");
    formData.set("role", "LAND_OWNER");
    formData.set("packageTier", "GOLD");
    formData.set("approved", "on");

    const result = await updateUserAccessAction({ ok: false }, formData);

    expect(result).toEqual({
      ok: false,
      message: "Expiry date/time is required for approved users."
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("requires a paid package when approving a land owner", async () => {
    const formData = new FormData();
    formData.set("userId", "user_1");
    formData.set("role", "LAND_OWNER");
    formData.set("packageTier", "NONE");
    formData.set("approved", "on");
    formData.set("subscriptionExpiresAt", "2026-06-01T00:00");

    const result = await updateUserAccessAction({ ok: false }, formData);

    expect(result).toEqual({
      ok: false,
      message: "Choose a paid package before approving a user."
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("keeps requested package tiers on pending users", async () => {
    const formData = new FormData();
    formData.set("userId", "user_1");
    formData.set("role", "PENDING_USER");
    formData.set("packageTier", "GOLD");

    const result = await updateUserAccessAction({ ok: false }, formData);

    expect(result).toEqual({
      ok: true,
      message: "User access updated."
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        id: "user_1"
      },
      data: {
        role: "PENDING_USER",
        packageTier: "GOLD",
        subscriptionApprovedAt: null,
        subscriptionExpiresAt: null
      }
    });
  });

  it("creates a paid land owner that can sign in immediately", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "user_2" });

    const formData = new FormData();
    formData.set("name", "New Owner");
    formData.set("email", "  Owner@Example.COM ");
    formData.set("password", "Secret123!");
    formData.set("packageTier", "GOLD");

    const result = await createPlatformUserAction({ ok: false }, formData);

    expect(result).toEqual({
      ok: true,
      message: "User created."
    });
    expect(mocks.hash).toHaveBeenCalledWith("Secret123!", 10);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "New Owner",
        email: "owner@example.com",
        password: "hashed-password",
        role: "LAND_OWNER",
        packageTier: "GOLD",
        ownerId: null,
        subscriptionApprovedAt: expect.any(Date),
        subscriptionExpiresAt: expect.any(Date)
      })
    });
  });

  it("creates a default user as an active non-premium land owner", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "user_3" });

    const formData = new FormData();
    formData.set("name", "Default Owner");
    formData.set("email", "default@example.com");
    formData.set("password", "Secret123!");
    formData.set("packageTier", "NONE");

    const result = await createPlatformUserAction({ ok: false }, formData);

    expect(result).toEqual({
      ok: true,
      message: "User created."
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Default Owner",
        email: "default@example.com",
        password: "hashed-password",
        role: "LAND_OWNER",
        packageTier: "NONE",
        ownerId: null,
        subscriptionApprovedAt: null,
        subscriptionExpiresAt: null
      })
    });
  });

  it("rejects duplicate emails when creating a platform user", async () => {
    mocks.findUnique.mockResolvedValue({ id: "existing_user" });

    const formData = new FormData();
    formData.set("name", "Existing Owner");
    formData.set("email", "owner@example.com");
    formData.set("password", "Secret123!");
    formData.set("packageTier", "SILVER");

    const result = await createPlatformUserAction({ ok: false }, formData);

    expect(result).toEqual({
      ok: false,
      message: "An account already exists for this email."
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
