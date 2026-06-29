import { describe, expect, it } from "vitest";

import { harvestEntrySchema } from "@/server/validators/harvest.schema";

const harvest = {
  cropSeasonId: "season_1",
  quantity: "100",
  unit: "Maund",
  harvestDate: "2026-06-24",
  notes: "First picking"
};

describe("harvestEntrySchema", () => {
  it("accepts a harvest without sales data", () => {
    expect(harvestEntrySchema.safeParse({ ...harvest, includeSale: "false" }).success).toBe(true);
  });

  it("accepts complete optional sales data", () => {
    expect(
      harvestEntrySchema.safeParse({
        ...harvest,
        includeSale: "true",
        buyerName: "City Market",
        saleDate: "2026-06-24",
        saleQuantity: "40",
        unitPrice: "4200",
        received: "100000"
      }).success
    ).toBe(true);
  });

  it("rejects incomplete sales data when sales are enabled", () => {
    const result = harvestEntrySchema.safeParse({
      ...harvest,
      includeSale: "true",
      buyerName: "",
      saleDate: "",
      saleQuantity: "",
      unitPrice: "",
      received: "0"
    });

    expect(result.success).toBe(false);
  });
});
