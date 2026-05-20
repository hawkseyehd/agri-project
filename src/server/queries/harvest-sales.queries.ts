import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type HarvestSalesAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

type HarvestQuantityRecord = {
  quantity: unknown;
};

type SaleAmountRecord = {
  quantity: unknown;
  unitPrice: unknown;
  received: unknown;
};

type SaleWithAmounts = SaleAmountRecord & {
  amounts: ReturnType<typeof calculateSaleAmounts>;
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

export function calculateSaleAmounts(input: { quantity: number; unitPrice: number; received: number }) {
  const grossAmount = input.quantity * input.unitPrice;
  const netAmount = grossAmount;
  const receivableAmount = Math.max(netAmount - input.received, 0);
  const paymentStatus = receivableAmount === 0 ? "PAID" : input.received > 0 ? "PARTIAL" : "PENDING";

  return {
    grossAmount,
    netAmount,
    receivableAmount,
    paymentStatus
  };
}

export async function getHarvestSales(context: HarvestSalesAccessContext) {
  const [harvests, sales] = await Promise.all([
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

  return {
    harvests,
    sales: sales.map((sale: SaleAmountRecord) => ({
      ...sale,
      amounts: calculateSaleAmounts({
        quantity: Number(sale.quantity),
        unitPrice: Number(sale.unitPrice),
        received: Number(sale.received)
      })
    }))
  };
}

export async function getHarvestSalesSummary(context: HarvestSalesAccessContext) {
  const { harvests, sales } = await getHarvestSales(context);
  const totalHarvested = harvests.reduce(
    (total: number, harvest: HarvestQuantityRecord) => total + Number(harvest.quantity),
    0
  );

  return sales.reduce(
    (
      summary: {
        totalHarvested: number;
        totalSold: number;
        totalRevenue: number;
        receivable: number;
        harvestCount: number;
        salesCount: number;
      },
      sale: SaleWithAmounts
    ) => {
      summary.totalSold += Number(sale.quantity);
      summary.totalRevenue += sale.amounts.netAmount;
      summary.receivable += sale.amounts.receivableAmount;
      return summary;
    },
    {
      totalHarvested,
      totalSold: 0,
      totalRevenue: 0,
      receivable: 0,
      harvestCount: harvests.length,
      salesCount: sales.length
    }
  );
}
