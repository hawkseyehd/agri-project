import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { buildDashboardSummary } from "@/server/services/dashboard/dashboard.service";

export type DashboardAccessContext = {
  role: Role;
  assignedFarmIds: string[];
  farmId?: string;
};

function farmScopedFilter(context: DashboardAccessContext) {
  if (context.farmId) {
    const farmId = canAccessAllFarms(context.role) || context.assignedFarmIds.includes(context.farmId) ? context.farmId : "__no_access__";

    return {
      block: {
        farmId
      }
    };
  }

  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    block: {
      farmId: {
        in: context.assignedFarmIds
      }
    }
  };
}

function farmIdFilter(context: DashboardAccessContext) {
  if (context.farmId) {
    const farmId = canAccessAllFarms(context.role) || context.assignedFarmIds.includes(context.farmId) ? context.farmId : "__no_access__";

    return {
      farmId
    };
  }

  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    farmId: {
      in: context.assignedFarmIds
    }
  };
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function getDashboardPageData(context: DashboardAccessContext) {
  const { start, end } = todayRange();

  const [activeCropSeasons, submittedDailyReports, expenses, sales, lowStockItems, recentReports] = await Promise.all([
    prisma.cropSeason.findMany({
      where: {
        status: "ACTIVE",
        ...farmScopedFilter(context)
      },
      include: {
        block: {
          include: {
            farm: true
          }
        }
      },
      orderBy: {
        startDate: "desc"
      },
      take: 6
    }),
    prisma.dailyReport.count({
      where: {
        reportDate: {
          gte: start,
          lt: end
        },
        cropSeason: farmScopedFilter(context)
      }
    }),
    prisma.expense.findMany({
      where: farmIdFilter(context),
      select: {
        amount: true,
        category: true
      }
    }),
    prisma.sale.findMany({
      where: {
        cropSeason: farmScopedFilter(context)
      },
      select: {
        quantity: true,
        unitPrice: true,
        received: true
      }
    }),
    prisma.inventoryItem.findMany({
      where: farmIdFilter(context),
      include: {
        farm: true
      },
      orderBy: {
        name: "asc"
      },
      take: 5
    }),
    prisma.dailyReport.findMany({
      where: {
        cropSeason: farmScopedFilter(context)
      },
      include: {
        cropSeason: {
          include: {
            block: {
              include: {
                farm: true
              }
            }
          }
        }
      },
      orderBy: {
        reportDate: "desc"
      },
      take: 5
    })
  ]);

  const visibleLowStockItems = lowStockItems.filter((item) => Number(item.quantity) <= Number(item.lowStockLevel)).slice(0, 5);

  const summary = buildDashboardSummary({
    activeCropSeasons: activeCropSeasons.length,
    dueDailyReports: activeCropSeasons.length,
    submittedDailyReports,
    expenses: expenses.map((expense) => ({ amount: Number(expense.amount) })),
    sales: sales.map((sale) => ({
      quantity: Number(sale.quantity),
      unitPrice: Number(sale.unitPrice),
      received: Number(sale.received)
    })),
    lowStockItems: visibleLowStockItems.map((item) => ({ id: item.id })),
    presentWorkers: 0,
    wagesToday: 0
  });

  return {
    summary,
    activeCropSeasons,
    expenseBreakdown: expenses.reduce<Record<string, number>>((breakdown, expense) => {
      breakdown[expense.category] = (breakdown[expense.category] ?? 0) + Number(expense.amount);
      return breakdown;
    }, {}),
    lowStockItems: visibleLowStockItems,
    recentReports
  };
}
