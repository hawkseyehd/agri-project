import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type ExpenseAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

export type ExpenseFilters = {
  farmId?: string;
  blockId?: string;
  cropSeasonId?: string;
  category?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
};

function accessibleFarmFilter(context: ExpenseAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    farmId: {
      in: context.assignedFarmIds
    }
  };
}

function expenseWhere(context: ExpenseAccessContext, filters: ExpenseFilters = {}) {
  return {
    ...accessibleFarmFilter(context),
    ...(filters.farmId ? { farmId: filters.farmId } : {}),
    ...(filters.cropSeasonId ? { cropSeasonId: filters.cropSeasonId } : {}),
    ...(filters.blockId
      ? {
          cropSeason: {
            blockId: filters.blockId
          }
        }
      : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          expenseDate: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {})
          }
        }
      : {})
  };
}

export async function getExpenses(context: ExpenseAccessContext, filters: ExpenseFilters = {}) {
  return prisma.expense.findMany({
    where: expenseWhere(context, filters),
    include: {
      farm: true,
      cropSeason: {
        include: {
          block: true
        }
      }
    },
    orderBy: {
      expenseDate: "desc"
    }
  });
}

export async function getExpenseSummary(context: ExpenseAccessContext, filters: ExpenseFilters = {}) {
  const expenses: Array<{ amount: unknown; paymentStatus: string }> = await prisma.expense.findMany({
    where: expenseWhere(context, filters),
    select: {
      amount: true,
      paymentStatus: true
    }
  });

  return expenses.reduce(
    (summary: { total: number; paid: number; unpaid: number; count: number }, expense: { amount: unknown; paymentStatus: string }) => {
      const amount = Number(expense.amount);
      summary.total += amount;

      if (expense.paymentStatus === "PAID") {
        summary.paid += amount;
      } else {
        summary.unpaid += amount;
      }

      return summary;
    },
    {
      total: 0,
      paid: 0,
      unpaid: 0,
      count: expenses.length
    }
  );
}
