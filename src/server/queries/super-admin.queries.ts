import { prisma } from "@/server/db/prisma";
import { calculateFarmFinancials } from "@/server/services/farms/financials.service";
import { buildSaasMetrics } from "@/server/services/subscriptions/subscription.service";

export type SuperAdminDateRange = {
  from?: Date;
  to?: Date;
};

function rangeFilter(range: SuperAdminDateRange) {
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lt: range.to } : {})
  };
}

function dateWhere(range: SuperAdminDateRange) {
  const filter = rangeFilter(range);
  return Object.keys(filter).length > 0 ? filter : undefined;
}

export async function getSuperAdminDashboardData(range: SuperAdminDateRange = {}) {
  const createdAt = dateWhere(range);
  const userWhere = createdAt ? { createdAt } : {};
  const farmWhere = createdAt ? { createdAt } : {};

  const [
    users,
    farmCount,
    reports,
    cropSeasons,
    landBlocks,
    expenses,
    inventoryItems,
    inventoryMovements,
    laborAttendance,
    workers,
    harvests,
    sales
  ] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      include: {
        assignments: {
          include: {
            farm: true
          }
        },
        owner: true,
        ownedFarms: true,
        tenantUsers: true
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }]
    }),
    prisma.farm.count({
      where: farmWhere
    }),
    prisma.dailyReport.count({
      where: {
        ...(dateWhere(range) ? { reportDate: dateWhere(range) } : {})
      }
    }),
    prisma.cropSeason.count({
      where: {
        ...(createdAt ? { createdAt } : {})
      }
    }),
    prisma.landBlock.count({
      where: {
        ...(createdAt ? { createdAt } : {})
      }
    }),
    prisma.expense.count({
      where: {
        ...(dateWhere(range) ? { expenseDate: dateWhere(range) } : {})
      }
    }),
    prisma.inventoryItem.count({
      where: {
        ...(createdAt ? { createdAt } : {})
      }
    }),
    prisma.inventoryMovement.count({
      where: {
        ...(createdAt ? { createdAt } : {})
      }
    }),
    prisma.laborAttendance.count({
      where: {
        ...(dateWhere(range) ? { reportDate: dateWhere(range) } : {})
      }
    }),
    prisma.worker.count({
      where: {
        ...(createdAt ? { createdAt } : {})
      }
    }),
    prisma.harvest.count({
      where: {
        ...(dateWhere(range) ? { harvestDate: dateWhere(range) } : {})
      }
    }),
    prisma.sale.count({
      where: {
        ...(dateWhere(range) ? { saleDate: dateWhere(range) } : {})
      }
    })
  ]);

  const metrics = buildSaasMetrics({
    users,
    farmCount,
    operationalCounts: {
      reports,
      cropSeasons,
      landBlocks,
      expenses,
      inventoryItems,
      inventoryMovements,
      laborAttendance,
      workers,
      harvests,
      sales
    }
  });

  return {
    metrics,
    users,
    pendingUsers: users.filter((user) => user.role === "PENDING_USER"),
    approvedOwners: users.filter((user) => user.role === "LAND_OWNER")
  };
}

export async function getSuperAdminFarmList() {
  const farms = await prisma.farm.findMany({
    include: {
      owner: true,
      blocks: {
        include: {
          seasons: {
            include: {
              sales: true
            }
          }
        }
      },
      expenses: true,
      items: true,
      workers: true
    },
    orderBy: {
      name: "asc"
    }
  });

  return farms.map((farm) => ({
    ...farm,
    financials: calculateFarmFinancials(farm)
  }));
}

export async function getSuperAdminInventorySummary() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["LAND_OWNER", "OWNER", "ADMIN"]
      }
    },
    include: {
      ownedFarms: {
        include: {
          items: {
            include: {
              farm: true,
              movements: {
                orderBy: {
                  createdAt: "desc"
                },
                take: 3
              }
            },
            orderBy: [{ itemType: "asc" }, { name: "asc" }]
          }
        },
        orderBy: {
          name: "asc"
        }
      }
    },
    orderBy: [{ companyName: "asc" }, { name: "asc" }]
  });

  return users.map((user) => {
    const items = user.ownedFarms.flatMap((farm) => farm.items.map((item) => ({ ...item, farm })));
    const totalQuantity = items.reduce((total, item) => total + Number(item.quantity ?? 0), 0);
    const lowStockItems = items.filter((item) => Number(item.quantity ?? 0) <= Number(item.lowStockLevel ?? 0));
    const itemTypes = items.reduce<Record<string, number>>((counts, item) => {
      counts[item.itemType] = (counts[item.itemType] ?? 0) + 1;
      return counts;
    }, {});

    return {
      owner: user,
      companyName: user.companyName ?? user.name,
      farms: user.ownedFarms,
      items,
      itemTypes,
      totalQuantity,
      lowStockItems
    };
  });
}
