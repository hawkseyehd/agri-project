import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findCropSeasons: vi.fn(),
  findHarvests: vi.fn(),
  findSales: vi.fn()
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    cropSeason: { findMany: mocks.findCropSeasons },
    harvest: { findMany: mocks.findHarvests },
    sale: { findMany: mocks.findSales }
  }
}));

import { getCropSeasons } from "@/server/queries/crop-seasons.queries";
import { getHarvestSalesPageData } from "@/server/queries/harvest-sales/harvest-sales.queries";

describe("archive query filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCropSeasons.mockResolvedValue([]);
    mocks.findHarvests.mockResolvedValue([]);
    mocks.findSales.mockResolvedValue([]);
  });

  it("excludes archived crop seasons from the crop list", async () => {
    await getCropSeasons({ role: "SUPER_ADMIN", assignedFarmIds: [] });

    expect(mocks.findCropSeasons).toHaveBeenCalledWith(expect.objectContaining({
      where: { archivedAt: null }
    }));
  });

  it("excludes archived records from Harvest and Sales data", async () => {
    await getHarvestSalesPageData({ role: "SUPER_ADMIN", assignedFarmIds: [] });

    expect(mocks.findCropSeasons).toHaveBeenCalledWith(expect.objectContaining({ where: { archivedAt: null } }));
    expect(mocks.findHarvests).toHaveBeenCalledWith(expect.objectContaining({ where: { archivedAt: null } }));
    expect(mocks.findSales).toHaveBeenCalledWith(expect.objectContaining({ where: { archivedAt: null } }));
  });
});
