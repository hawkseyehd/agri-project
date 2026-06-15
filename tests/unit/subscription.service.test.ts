import { describe, expect, it } from "vitest";

import {
  buildSaasMetrics,
  getPackageBlockLimit,
  getPackageMonthlyPrice
} from "@/server/services/subscriptions/subscription.service";

describe("subscription service", () => {
  it("maps packages to monthly prices", () => {
    expect(getPackageMonthlyPrice("NONE")).toBe(0);
    expect(getPackageMonthlyPrice("SILVER")).toBe(10);
    expect(getPackageMonthlyPrice("GOLD")).toBe(25);
    expect(getPackageMonthlyPrice("PLATINUM")).toBe(50);
  });

  it("maps packages to total block limits", () => {
    expect(getPackageBlockLimit("NONE")).toBe(0);
    expect(getPackageBlockLimit("SILVER")).toBe(5);
    expect(getPackageBlockLimit("GOLD")).toBe(10);
    expect(getPackageBlockLimit("PLATINUM")).toBe(20);
  });

  it("builds SaaS metrics from users, farms, and operational counts", () => {
    const metrics = buildSaasMetrics({
      users: [
        { packageTier: "NONE", subscriptionApprovedAt: null, ownedFarms: [] },
        { packageTier: "SILVER", subscriptionApprovedAt: new Date("2026-05-01"), ownedFarms: [{ id: "farm_1" }] },
        { packageTier: "GOLD", subscriptionApprovedAt: null, ownedFarms: [] },
        { packageTier: "PLATINUM", subscriptionApprovedAt: new Date("2026-05-01"), ownedFarms: [{ id: "farm_2" }, { id: "farm_3" }] }
      ],
      farmCount: 3,
      operationalCounts: {
        reports: 9,
        cropSeasons: 4,
        landBlocks: 12,
        expenses: 6,
        inventoryItems: 7,
        inventoryMovements: 5,
        laborAttendance: 3,
        workers: 8,
        harvests: 2,
        yields: 2,
        sales: 1
      }
    });

    expect(metrics.totalUsers).toBe(4);
    expect(metrics.planCounts).toEqual({
      NONE: 1,
      SILVER: 1,
      GOLD: 1,
      PLATINUM: 1
    });
    expect(metrics.monthlyRecurringRevenue).toBe(60);
    expect(metrics.premiumUsers).toBe(2);
    expect(metrics.nonPremiumUsers).toBe(2);
    expect(metrics.usersWithoutFarms).toBe(2);
    expect(metrics.totalFarms).toBe(3);
    expect(metrics.operationalCounts.reports).toBe(9);
    expect(metrics.operationalTotal).toBe(59);
  });
});
