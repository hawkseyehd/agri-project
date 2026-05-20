import { describe, expect, it } from "vitest";

import { calculateSaleAmounts, summarizeHarvestSales } from "@/server/services/harvest-sales/harvest-sales.service";

describe("harvest-sales service", () => {
  it("calculates gross, net, receivable, and payment status for a partial sale", () => {
    expect(
      calculateSaleAmounts({
        quantity: 25,
        unitPrice: 4200,
        received: 50000
      })
    ).toEqual({
      grossAmount: 105000,
      netAmount: 105000,
      receivableAmount: 55000,
      paymentStatus: "PARTIAL"
    });
  });

  it("summarizes harvest and sale records for revenue cards", () => {
    expect(
      summarizeHarvestSales({
        harvests: [
          { quantity: 100 },
          { quantity: 50 }
        ],
        sales: [
          { quantity: 40, unitPrice: 3000, received: 120000 },
          { quantity: 20, unitPrice: 2500, received: 10000 }
        ]
      })
    ).toEqual({
      totalHarvested: 150,
      totalSold: 60,
      totalRevenue: 170000,
      receivable: 40000,
      harvestCount: 2,
      salesCount: 2
    });
  });
});
