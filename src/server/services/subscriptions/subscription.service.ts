import type { PackageTier } from "@prisma/client";

export type OperationalCounts = {
  reports: number;
  cropSeasons: number;
  landBlocks: number;
  expenses: number;
  inventoryItems: number;
  inventoryMovements: number;
  laborAttendance: number;
  workers: number;
  harvests: number;
  yields: number;
  sales: number;
};

type SaasMetricUser = {
  packageTier: PackageTier;
  subscriptionApprovedAt?: Date | string | null;
  ownedFarms: Array<{ id: string }>;
};

export function getPackageMonthlyPrice(packageTier: PackageTier) {
  if (packageTier === "SILVER") {
    return 10;
  }

  if (packageTier === "GOLD") {
    return 25;
  }

  if (packageTier === "PLATINUM") {
    return 50;
  }

  return 0;
}

export function getPackageBlockLimit(packageTier: PackageTier) {
  if (packageTier === "SILVER") {
    return 5;
  }

  if (packageTier === "GOLD") {
    return 10;
  }

  if (packageTier === "PLATINUM") {
    return 20;
  }

  return 0;
}

export function isApprovedPremiumUser(user: Pick<SaasMetricUser, "packageTier" | "subscriptionApprovedAt">) {
  return user.packageTier !== "NONE" && Boolean(user.subscriptionApprovedAt);
}

export function buildSaasMetrics({
  users,
  farmCount,
  operationalCounts
}: {
  users: SaasMetricUser[];
  farmCount: number;
  operationalCounts: OperationalCounts;
}) {
  const planCounts = users.reduce<Record<PackageTier, number>>(
    (counts, user) => {
      counts[user.packageTier] += 1;
      return counts;
    },
    {
      NONE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0
    }
  );

  const premiumUsers = users.filter(isApprovedPremiumUser);
  const operationalTotal = Object.values(operationalCounts).reduce((total, count) => total + count, 0);

  return {
    totalUsers: users.length,
    planCounts,
    monthlyRecurringRevenue: premiumUsers.reduce((total, user) => total + getPackageMonthlyPrice(user.packageTier), 0),
    premiumUsers: premiumUsers.length,
    nonPremiumUsers: users.length - premiumUsers.length,
    usersWithoutFarms: users.filter((user) => user.ownedFarms.length === 0).length,
    totalFarms: farmCount,
    operationalCounts,
    operationalTotal
  };
}
