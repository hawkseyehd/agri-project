import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  hash: vi.fn(async () => "hashed-password")
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mocks.hash
  }
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      create: mocks.create,
      findUnique: mocks.findUnique
    }
  }
}));

import { registerUserAction } from "../../src/server/actions/auth.actions";

describe("registerUserAction", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.findUnique.mockReset();
    mocks.hash.mockClear();
  });

  it("creates beta registrations as active gold land owners", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "user_1" });

    const formData = new FormData();
    formData.set("name", "Beta Owner");
    formData.set("email", "  Beta@Example.COM ");
    formData.set("password", "ChangeMe123!");
    formData.set("confirmPassword", "ChangeMe123!");

    await expect(registerUserAction({ ok: false }, formData)).resolves.toEqual({
      ok: true,
      message: "Account created. Signing you in..."
    });

    expect(mocks.hash).toHaveBeenCalledWith("ChangeMe123!", 10);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "Beta Owner",
        email: "beta@example.com",
        password: "hashed-password",
        role: "LAND_OWNER",
        packageTier: "GOLD",
        ownerId: null,
        subscriptionApprovedAt: expect.any(Date),
        subscriptionExpiresAt: expect.any(Date)
      }
    });
  });
});
