import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { calculateSaleAmounts, summarizeHarvestSales } from "@/server/services/harvest-sales/harvest-sales.service";

export type HarvestSalesAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

function cropSeasonAccessFilter(context: HarvestSalesAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    cropSeason: {
      block: {
        farmId: {
          in: context.assignedFarmIds
        }
      }
    }
  };
}

function accessibleCropSeasonFilter(context: HarvestSalesAccessContext) {
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

export async function getHarvestSalesPageData(context: HarvestSalesAccessContext) {
  const [cropSeasons, harvests, sales] = await Promise.all([
    prisma.cropSeason.findMany({
      where: accessibleCropSeasonFilter(context),
      include: {
        block: {
          include: {
            farm: true
          }
        }
      },
      orderBy: [{ status: "asc" }, { startDate: "desc" }]
    }),
    prisma.harvest.findMany({
      where: cropSeasonAccessFilter(context),
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
        harvestDate: "desc"
      }
    }),
    prisma.sale.findMany({
      where: cropSeasonAccessFilter(context),
      include: {
        cropSeason: {
          include: {
            block: {
              include: {
                farm: true
              }
            }
          }
        },
        harvest: true
      },
      orderBy: {
        saleDate: "desc"
      }
    })
  ]);

  const salesWithAmounts = sales.map((sale) => ({
    ...sale,
    amounts: calculateSaleAmounts({
      quantity: Number(sale.quantity),
      unitPrice: Number(sale.unitPrice),
      received: Number(sale.received)
    })
  }));

  return {
    cropSeasons,
    harvests,
    sales: salesWithAmounts,
    summary: summarizeHarvestSales({
      harvests: harvests.map((harvest) => ({
        quantity: Number(harvest.quantity)
      })),
      sales: sales.map((sale) => ({
        quantity: Number(sale.quantity),
        unitPrice: Number(sale.unitPrice),
        received: Number(sale.received)
      }))
    })
  };
}
