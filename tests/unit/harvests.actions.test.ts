import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSessionUser: vi.fn(),
  assertCanUsePageAction: vi.fn(),
  canAccessFarm: vi.fn(() => true),
  findCropSeason: vi.fn(),
  createHarvest: vi.fn(),
  createYield: vi.fn(),
  createSale: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/server/auth/auth", () => ({
  auth: mocks.auth,
  getSessionUser: mocks.getSessionUser
}));

vi.mock("@/server/auth/page-permissions", () => ({
  assertCanUsePageAction: mocks.assertCanUsePageAction
}));

vi.mock("@/server/auth/permissions", () => ({
  canAccessFarm: mocks.canAccessFarm
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    cropSeason: {
      findUnique: mocks.findCropSeason
    },
    $transaction: mocks.transaction
  }
}));

import { createHarvestAction } from "@/server/actions/harvests.actions";

describe("createHarvestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: {
        id: "owner_1",
        role: "LAND_OWNER",
        assignedFarmIds: []
      }
    });
    mocks.getSessionUser.mockReturnValue({
      id: "owner_1",
      role: "LAND_OWNER",
      assignedFarmIds: [],
      pagePermissions: []
    });
    mocks.findCropSeason.mockResolvedValue({
      id: "season_1",
      cropName: "Wheat",
      block: {
        id: "block_1",
        farmId: "farm_1",
        farm: {
          id: "farm_1",
          ownerId: "owner_1",
          name: "Main Farm",
          city: null,
          district: null,
          region: null,
          country: null
        }
      }
    });
    mocks.createHarvest.mockResolvedValue({ id: "harvest_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        harvest: { create: mocks.createHarvest },
        yieldRecord: { create: mocks.createYield },
        sale: { create: mocks.createSale }
      })
    );
  });

  it("creates and links optional sales data in the harvest transaction", async () => {
    const formData = new FormData();
    formData.set("cropSeasonId", "season_1");
    formData.set("quantity", "100");
    formData.set("unit", "Maund");
    formData.set("harvestDate", "2026-06-24");
    formData.set("notes", "First picking");
    formData.set("includeSale", "true");
    formData.set("buyerName", "City Market");
    formData.set("saleDate", "2026-06-24");
    formData.set("saleQuantity", "40");
    formData.set("unitPrice", "4200");
    formData.set("received", "100000");

    await expect(createHarvestAction({ ok: false }, formData)).resolves.toEqual({
      ok: true,
      message: "Harvest and sale recorded."
    });

    expect(mocks.createSale).toHaveBeenCalledWith({
      data: {
        cropSeasonId: "season_1",
        harvestId: "harvest_1",
        buyerName: "City Market",
        quantity: "40",
        unitPrice: "4200",
        saleDate: new Date("2026-06-24"),
        received: "100000"
      }
    });
  });

  it("blocks an early harvest until the user confirms it", async () => {
    mocks.findCropSeason.mockResolvedValue({
      ...(await mocks.findCropSeason()),
      endDate: new Date("2026-07-15")
    });

    const formData = new FormData();
    formData.set("cropSeasonId", "season_1");
    formData.set("quantity", "100");
    formData.set("unit", "Maund");
    formData.set("harvestDate", "2026-06-24");
    formData.set("includeSale", "false");
    formData.set("allowEarlyHarvest", "false");

    await expect(createHarvestAction({ ok: false }, formData)).resolves.toEqual({
      ok: false,
      message: "Harvest date is before the expected harvest date. Confirm early harvest to continue."
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("records an explicitly confirmed early harvest", async () => {
    mocks.findCropSeason.mockResolvedValue({
      ...(await mocks.findCropSeason()),
      endDate: new Date("2026-07-15")
    });

    const formData = new FormData();
    formData.set("cropSeasonId", "season_1");
    formData.set("quantity", "100");
    formData.set("unit", "Maund");
    formData.set("harvestDate", "2026-06-24");
    formData.set("includeSale", "false");
    formData.set("allowEarlyHarvest", "true");

    await expect(createHarvestAction({ ok: false }, formData)).resolves.toEqual({
      ok: true,
      message: "Harvest recorded."
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
