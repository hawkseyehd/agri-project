import { describe, expect, it } from "vitest";

import { dailyReportSchema } from "@/server/validators/daily-report.schema";

describe("dailyReportSchema", () => {
  it("accepts a valid draft daily report payload", () => {
    const result = dailyReportSchema.safeParse({
      cropSeasonId: "season_123",
      reportDate: "2026-04-28",
      notes: "Irrigated the west block.",
      status: "DRAFT"
    });

    expect(result.success).toBe(true);
  });

  it("requires notes before final submit", () => {
    const result = dailyReportSchema.safeParse({
      cropSeasonId: "season_123",
      reportDate: "2026-04-28",
      notes: "",
      status: "SUBMITTED"
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid report date", () => {
    const result = dailyReportSchema.safeParse({
      cropSeasonId: "season_123",
      reportDate: "not-a-date",
      notes: "Checked crop condition.",
      status: "DRAFT"
    });

    expect(result.success).toBe(false);
  });
});
