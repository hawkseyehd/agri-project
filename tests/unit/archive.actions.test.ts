import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSessionUser: vi.fn(),
  assertCanUsePageAction: vi.fn(),
  canAccessFarm: vi.fn(() => true),
  findBlock: vi.fn(),
  findCropSeason: vi.fn(),
  updateCropSeason: vi.fn(),
  findHarvest: vi.fn(),
  updateHarvest: vi.fn(),
  findSale: vi.fn(),
  updateSale: vi.fn(),
  revalidatePath: vi.fn()
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
    landBlock: { findUnique: mocks.findBlock },
    cropSeason: {
      findUnique: mocks.findCropSeason,
      update: mocks.updateCropSeason
    },
    harvest: {
      findUnique: mocks.findHarvest,
      update: mocks.updateHarvest
    },
    sale: {
      findUnique: mocks.findSale,
      update: mocks.updateSale
    }
  }
}));

import { archiveCropSeasonAction } from "@/server/actions/crop-seasons.actions";
import { archiveHarvestAction } from "@/server/actions/harvests.actions";
import { archiveSaleAction } from "@/server/actions/sales.actions";

describe("archive actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "owner_1", role: "LAND_OWNER", assignedFarmIds: [] } });
    mocks.getSessionUser.mockReturnValue({
      id: "owner_1",
      role: "LAND_OWNER",
      assignedFarmIds: [],
      pagePermissions: []
    });
    mocks.findBlock.mockResolvedValue({ farmId: "farm_1" });
    mocks.findCropSeason.mockResolvedValue({
      id: "season_1",
      blockId: "block_1",
      block: { farmId: "farm_1" }
    });
    mocks.findHarvest.mockResolvedValue({ id: "harvest_1", cropSeasonId: "season_1" });
    mocks.findSale.mockResolvedValue({ id: "sale_1", cropSeasonId: "season_1" });
  });

  it("archives a harvest without deleting it", async () => {
    await expect(archiveHarvestAction("harvest_1")).resolves.toEqual({ ok: true, message: "Harvest archived." });

    expect(mocks.updateHarvest).toHaveBeenCalledWith({
      where: { id: "harvest_1" },
      data: { archivedAt: expect.any(Date) }
    });
    expect(mocks.assertCanUsePageAction).toHaveBeenCalledWith(expect.any(Object), "HARVEST_SALES", "delete");
  });

  it("archives a sale without deleting it", async () => {
    await expect(archiveSaleAction("sale_1")).resolves.toEqual({ ok: true, message: "Sale archived." });

    expect(mocks.updateSale).toHaveBeenCalledWith({
      where: { id: "sale_1" },
      data: { archivedAt: expect.any(Date) }
    });
    expect(mocks.assertCanUsePageAction).toHaveBeenCalledWith(expect.any(Object), "HARVEST_SALES", "delete");
  });

  it("archives a crop season without deleting related records", async () => {
    await expect(archiveCropSeasonAction("season_1")).resolves.toEqual({ ok: true, message: "Crop season archived." });

    expect(mocks.updateCropSeason).toHaveBeenCalledWith({
      where: { id: "season_1" },
      data: { archivedAt: expect.any(Date) }
    });
    expect(mocks.assertCanUsePageAction).toHaveBeenCalledWith(expect.any(Object), "CROP_SEASONS", "delete");
  });
});
