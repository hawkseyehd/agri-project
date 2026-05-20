import { describe, expect, it } from "vitest";

import { cropSeasonSchema } from "../../src/server/validators/crop-season.schema";

describe("cropSeasonSchema", () => {
  it("accepts a valid crop season payload", () => {
    const result = cropSeasonSchema.safeParse({
      blockId: "block_123",
      cropType: "CROP",
      cropName: "Wheat",
      variety: "Galaxy",
      startDate: "2026-11-15",
      endDate: "2027-04-30",
      status: "PLANNED"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an expected harvest date before the sowing date", () => {
    const result = cropSeasonSchema.safeParse({
      blockId: "block_123",
      cropType: "CROP",
      cropName: "Wheat",
      startDate: "2026-11-15",
      endDate: "2026-10-30",
      status: "ACTIVE"
    });

    expect(result.success).toBe(false);
  });

  it("requires expected harvest for seasonal crops", () => {
    const result = cropSeasonSchema.safeParse({
      blockId: "block_123",
      cropType: "CROP",
      cropName: "Wheat",
      startDate: "2026-11-15",
      endDate: "",
      status: "PLANNED"
    });

    expect(result.success).toBe(false);
  });

  it("accepts trees with planting date and yearly harvest timing", () => {
    const result = cropSeasonSchema.safeParse({
      blockId: "block_123",
      cropType: "TREE",
      cropName: "Mango",
      startDate: "2026-02-10",
      endDate: "",
      harvestTiming: "June to July",
      status: "ACTIVE"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endDate).toBeUndefined();
      expect(result.data.harvestTiming).toBe("June to July");
    }
  });

  it("accepts plantain and ratoon with planting date only", () => {
    for (const cropType of ["PLANTAIN", "RATOON"] as const) {
      const result = cropSeasonSchema.safeParse({
        blockId: "block_123",
        cropType,
        cropName: "Sugarcane",
        startDate: "2026-09-05",
        endDate: "",
        harvestTiming: "",
        status: "ACTIVE"
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endDate).toBeUndefined();
        expect(result.data.harvestTiming).toBeUndefined();
      }
    }
  });
});
