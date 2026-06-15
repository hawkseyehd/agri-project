import { describe, expect, it } from "vitest";

import { summarizeYieldRecords } from "@/server/services/yields/yield.service";

describe("yield service", () => {
  it("aggregates crop yield by district and unit", () => {
    const summary = summarizeYieldRecords([
      {
        cropName: "Mango",
        quantity: 100,
        unit: "MAUND",
        yieldDate: new Date("2026-06-10"),
        city: "Multan",
        district: "Multan",
        farmId: "farm_1",
        ownerId: "owner_1"
      },
      {
        cropName: "Mango",
        quantity: 150,
        unit: "MAUND",
        yieldDate: new Date("2026-06-20"),
        city: "Multan",
        district: "Multan",
        farmId: "farm_2",
        ownerId: "owner_2"
      }
    ]);

    expect(summary.byDistrict).toEqual([
      {
        cropName: "Mango",
        district: "Multan",
        unit: "MAUND",
        totalQuantity: 250,
        farmCount: 2,
        ownerCount: 2,
        recordCount: 2
      }
    ]);
  });

  it("filters yield records by inclusive date range", () => {
    const summary = summarizeYieldRecords(
      [
        {
          cropName: "Mango",
          quantity: 80,
          unit: "MAUND",
          yieldDate: new Date("2025-06-15"),
          city: "Multan",
          district: "Multan",
          farmId: "farm_1",
          ownerId: "owner_1"
        },
        {
          cropName: "Mango",
          quantity: 150,
          unit: "MAUND",
          yieldDate: new Date("2026-06-20"),
          city: "Multan",
          district: "Multan",
          farmId: "farm_2",
          ownerId: "owner_2"
        }
      ],
      {
        from: new Date("2026-01-01"),
        to: new Date("2026-12-31")
      }
    );

    expect(summary.totals.quantity).toBe(150);
    expect(summary.totals.recordCount).toBe(1);
  });
});
