import { describe, expect, it, vi } from "vitest";

import {
  createCropSeason,
  updateCropSeason
} from "../../src/server/services/crop-seasons/mutations.service";

describe("crop season mutation service", () => {
  it("creates crop seasons with normalized dates and nullable expected harvest", async () => {
    const db = {
      cropSeason: {
        create: vi.fn().mockResolvedValue({ id: "season_1" })
      }
    };

    const season = await createCropSeason(db, {
      blockId: "block_1",
      cropType: "TREE",
      cropName: "Mango",
      variety: undefined,
      startDate: "2026-02-10",
      endDate: undefined,
      harvestTiming: "June to July",
      status: "ACTIVE"
    });

    expect(season.id).toBe("season_1");
    expect(db.cropSeason.create).toHaveBeenCalledWith({
      data: {
        blockId: "block_1",
        cropType: "TREE",
        cropName: "Mango",
        variety: undefined,
        startDate: new Date("2026-02-10T00:00:00.000Z"),
        endDate: null,
        harvestTiming: "June to July",
        status: "ACTIVE"
      }
    });
  });

  it("updates seasonal crops with an expected harvest date", async () => {
    const db = {
      cropSeason: {
        update: vi.fn().mockResolvedValue({ id: "season_1" })
      }
    };

    await updateCropSeason(db, "season_1", {
      blockId: "block_1",
      cropType: "CROP",
      cropName: "Wheat",
      variety: "Galaxy",
      startDate: "2026-11-15",
      endDate: "2027-04-30",
      harvestTiming: undefined,
      status: "PLANNED"
    });

    expect(db.cropSeason.update).toHaveBeenCalledWith({
      where: { id: "season_1" },
      data: {
        blockId: "block_1",
        cropType: "CROP",
        cropName: "Wheat",
        variety: "Galaxy",
        startDate: new Date("2026-11-15T00:00:00.000Z"),
        endDate: new Date("2027-04-30T00:00:00.000Z"),
        harvestTiming: undefined,
        status: "PLANNED"
      }
    });
  });
});
