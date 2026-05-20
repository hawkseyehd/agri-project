import { describe, expect, it } from "vitest";

import {
  draftNotifications,
  explainInventoryAlerts,
  explainReportTotals,
  extractReceiptFields,
  structureDailyReportNotes,
  summarizeDashboardStatus
} from "@/server/services/ai";

describe("deterministic AI service", () => {
  it("structures rough daily report notes into reviewable farm sections", async () => {
    const draft = await structureDailyReportNotes({
      notes: "Block A wheat: irrigated 3 acres, 4 workers weeded, bought diesel 7000 paid, used 2 bags urea. Pump belt issue."
    });

    expect(draft.provider).toBe("local");
    expect(draft.suggestions.activities).toContain("Block A wheat");
    expect(draft.suggestions.labor).toContain("4 workers");
    expect(draft.suggestions.expenses).toContain("diesel 7000");
    expect(draft.suggestions.inventoryUsage).toContain("2 bags urea");
    expect(draft.suggestions.irrigation).toContain("irrigated 3 acres");
    expect(draft.suggestions.issues).toContain("Pump belt issue");
    expect(draft.reviewReminder).toContain("Review");
  });

  it("summarizes dashboard status with risks and next actions", async () => {
    const summary = await summarizeDashboardStatus({
      activeCropSeasons: 2,
      dailyReports: { submitted: 1, due: 2, pending: 1 },
      seasonExpenses: 20000,
      expectedRevenue: 50000,
      profitEstimate: 30000,
      receivable: 12000,
      lowStockCount: 2,
      presentWorkers: 6,
      wagesToday: 4800
    });

    expect(summary.summary).toContain("2 active crop seasons");
    expect(summary.risks).toContain("1 daily report is still pending.");
    expect(summary.risks).toContain("2 inventory items are at or below reorder level.");
    expect(summary.nextActions).toContain("Follow up on PKR 12,000 receivables.");
  });

  it("explains report totals in plain language", async () => {
    const explanation = await explainReportTotals({
      rows: [
        { farmName: "Main Farm", blockName: "A", cropSeasonName: "Wheat", expenses: 10000, revenue: 25000, profitLoss: 15000, receivable: 5000 },
        { farmName: "Main Farm", blockName: "B", cropSeasonName: "Maize", expenses: 8000, revenue: 3000, profitLoss: -5000, receivable: 0 }
      ]
    });

    expect(explanation.summary).toContain("PKR 28,000 revenue");
    expect(explanation.summary).toContain("PKR 18,000 expenses");
    expect(explanation.highlights.some((item) => item.includes("Wheat"))).toBe(true);
    expect(explanation.watchouts.some((item) => item.includes("Maize"))).toBe(true);
  });

  it("extracts likely receipt fields from pasted receipt text", async () => {
    const extraction = await extractReceiptFields({
      text: "Agri Mart\nDate: 2026-05-10\nCategory: Fertilizer\nTotal PKR 12,450\nPaid cash",
      fileName: "receipt-agri-mart.jpg"
    });

    expect(extraction.fields.vendor).toBe("Agri Mart");
    expect(extraction.fields.date).toBe("2026-05-10");
    expect(extraction.fields.category).toBe("Fertilizer");
    expect(extraction.fields.amount).toBe(12450);
    expect(extraction.fields.paymentStatus).toBe("PAID");
    expect(extraction.confidenceNotes.length).toBeGreaterThan(0);
  });

  it("explains low-stock risk and reorder suggestions", async () => {
    const explanation = await explainInventoryAlerts({
      items: [
        { name: "Urea", farmName: "Main Farm", quantity: 2, lowStockLevel: 5, unit: "BAG" },
        { name: "Diesel", farmName: "Main Farm", quantity: 50, lowStockLevel: 40, unit: "LITER" }
      ]
    });

    expect(explanation.alerts).toHaveLength(1);
    expect(explanation.alerts[0].message).toContain("Urea");
    expect(explanation.alerts[0].suggestedReorderQuantity).toBe(8);
    expect(explanation.overallRisk).toContain("1 low-stock item");
  });

  it("drafts notifications from operational warnings", async () => {
    const drafts = await draftNotifications({
      lowStockItems: [{ name: "Urea", farmName: "Main Farm", quantity: 2, lowStockLevel: 5, unit: "BAG" }],
      missingReports: [{ farmName: "Main Farm", blockName: "A", cropName: "Wheat" }],
      receivableAmount: 15000,
      operationalWarnings: ["Pump maintenance due tomorrow"]
    });

    expect(drafts.drafts.map((draft) => draft.type)).toEqual(["Inventory", "Daily Report", "Receivable", "Operations"]);
    expect(drafts.drafts[0].message).toContain("Urea");
    expect(drafts.drafts[1].message).toContain("Wheat");
    expect(drafts.reviewReminder).toContain("review");
  });
});
