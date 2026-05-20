import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  updateUser: vi.fn(),
  countFarms: vi.fn(),
  createFarm: vi.fn(),
  transaction: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("@/server/auth/auth", () => ({
  requireAuthUser: mocks.requireAuthUser
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      update: mocks.updateUser
    },
    farm: {
      count: mocks.countFarms,
      create: mocks.createFarm
    },
    $transaction: mocks.transaction
  }
}));

import { createFirstFarmAction } from "@/server/actions/onboarding.actions";

describe("onboarding actions", () => {
  beforeEach(() => {
    mocks.requireAuthUser.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.redirect.mockClear();
    mocks.updateUser.mockReset();
    mocks.countFarms.mockReset();
    mocks.createFarm.mockReset();
    mocks.transaction.mockReset();
  });

  it("saves company name without requiring or creating a first farm", async () => {
    mocks.requireAuthUser.mockResolvedValue({
      id: "owner_1",
      role: "LAND_OWNER"
    });
    mocks.updateUser.mockResolvedValue({ id: "owner_1" });

    const formData = new FormData();
    formData.set("companyName", "Hawkseye Farms");

    await expect(createFirstFarmAction({ ok: false }, formData)).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: {
        id: "owner_1"
      },
      data: {
        companyName: "Hawkseye Farms"
      }
    });
    expect(mocks.countFarms).not.toHaveBeenCalled();
    expect(mocks.createFarm).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
