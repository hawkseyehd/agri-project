import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { buildProfitLossRows, toCsv } from "@/server/services/reports/report.service";

export type ReportsAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

export type ReportFilters = {
  farmId?: string;
  cropSeasonId?: string;
};

function farmAccessFilter(context: ReportsAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    id: {
      in: context.assignedFarmIds
    }
  };
}

function blockFarmAccessFilter(context: ReportsAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    farmId: {
      in: context.assignedFarmIds
    }
  };
}

function cropSeasonAccessFilter(context: ReportsAccessContext, filters: ReportFilters) {
  if (
    filters.farmId &&
    !canAccessAllFarms(context.role) &&
    !context.assignedFarmIds.includes(filters.farmId)
  ) {
    return {
      id: "__unauthorized_farm__"
    };
  }

  const farmFilter =
    filters.farmId
      ? {
          farmId: filters.farmId
        }
      : blockFarmAccessFilter(context);

  return {
    ...(filters.cropSeasonId ? { id: filters.cropSeasonId } : {}),
    block: farmFilter
  };
}

export async function getReportsPageData(context: ReportsAccessContext, filters: ReportFilters) {
  const [farms, cropSeasons] = await Promise.all([
    prisma.farm.findMany({
      where: farmAccessFilter(context),
      orderBy: {
        name: "asc"
      }
    }),
    prisma.cropSeason.findMany({
      where: cropSeasonAccessFilter(context, filters),
      include: {
        block: {
          include: {
            farm: true
          }
        },
        expenses: true,
        sales: true,
        harvests: true
      },
      orderBy: [{ startDate: "desc" }, { cropName: "asc" }]
    })
  ]);

  const profitLossRows = buildProfitLossRows(
    cropSeasons.map((season) => ({
      farmName: season.block.farm.name,
      blockName: season.block.name,
      cropSeasonName: season.cropName,
      expenses: season.expenses.map((expense) => ({ amount: Number(expense.amount) })),
      sales: season.sales.map((sale) => ({
        quantity: Number(sale.quantity),
        unitPrice: Number(sale.unitPrice),
        received: Number(sale.received)
      }))
    }))
  );

  const csv = toCsv(
    [
      { key: "farmName", label: "Farm" },
      { key: "blockName", label: "Block" },
      { key: "cropSeasonName", label: "Crop Season" },
      { key: "expenses", label: "Expenses" },
      { key: "revenue", label: "Revenue" },
      { key: "profitLoss", label: "Profit/Loss" },
      { key: "receivable", label: "Receivable" }
    ],
    profitLossRows
  );

  return {
    farms,
    cropSeasons,
    profitLossRows,
    csv
  };
}
