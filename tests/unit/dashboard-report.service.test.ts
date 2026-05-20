import { describe, expect, it } from "vitest";

import { buildDashboardSummary } from "@/server/services/dashboard/dashboard.service";
import { buildProfitLossRows, toCsv } from "@/server/services/reports/report.service";

describe("dashboard and report services", () => {
  it("builds dashboard KPI totals from operational records", () => {
    expect(
      buildDashboardSummary({
        activeCropSeasons: 3,
        dueDailyReports: 5,
        submittedDailyReports: 4,
        expenses: [{ amount: 10000 }, { amount: 2500 }],
        sales: [{ quantity: 10, unitPrice: 2000, received: 15000 }],
        lowStockItems: [{ id: "item_1" }],
        presentWorkers: 8,
        wagesToday: 6400
      })
    ).toEqual({
      activeCropSeasons: 3,
      dailyReports: {
        submitted: 4,
        due: 5,
        pending: 1
      },
      seasonExpenses: 12500,
      expectedRevenue: 20000,
      profitEstimate: 7500,
      receivable: 5000,
      lowStockCount: 1,
      presentWorkers: 8,
      wagesToday: 6400
    });
  });

  it("builds profit and loss rows by crop season", () => {
    expect(
      buildProfitLossRows([
        {
          farmName: "Main Farm",
          blockName: "Block A",
          cropSeasonName: "Wheat 2026",
          expenses: [{ amount: 25000 }, { amount: 5000 }],
          sales: [{ quantity: 20, unitPrice: 4500, received: 90000 }]
        }
      ])
    ).toEqual([
      {
        farmName: "Main Farm",
        blockName: "Block A",
        cropSeasonName: "Wheat 2026",
        expenses: 30000,
        revenue: 90000,
        profitLoss: 60000,
        receivable: 0
      }
    ]);
  });

  it("exports report rows as CSV with escaped values", () => {
    expect(
      toCsv(
        [
          { key: "farm", label: "Farm" },
          { key: "notes", label: "Notes" },
          { key: "amount", label: "Amount" }
        ],
        [{ farm: "Main Farm", notes: "Buyer said \"urgent, today\"", amount: 1200 }]
      )
    ).toBe("Farm,Notes,Amount\r\nMain Farm,\"Buyer said \"\"urgent, today\"\"\",1200");
  });
});
