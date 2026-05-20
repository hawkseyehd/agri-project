import { describe, expect, it } from "vitest";

import { calculateFarmFinancials } from "@/server/services/farms/financials.service";

describe("calculateFarmFinancials", () => {
  it("calculates revenue, expenses, and net profit for a farm", () => {
    expect(
      calculateFarmFinancials({
        expenses: [{ amount: 100 }, { amount: "50.5" }],
        blocks: [
          {
            seasons: [
              {
                sales: [
                  { quantity: 10, unitPrice: 20 },
                  { quantity: "2.5", unitPrice: "40" }
                ]
              }
            ]
          }
        ]
      })
    ).toEqual({
      revenue: 300,
      expenses: 150.5,
      netProfit: 149.5
    });
  });
});
