import { calculateSaleAmounts, type SaleAmountInput } from "@/server/services/harvest-sales/harvest-sales.service";

export type DashboardSummaryInput = {
  activeCropSeasons: number;
  dueDailyReports: number;
  submittedDailyReports: number;
  expenses: Array<{ amount: number | string }>;
  sales: SaleAmountInput[];
  lowStockItems: Array<{ id: string }>;
  presentWorkers: number;
  wagesToday: number;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

export function buildDashboardSummary(input: DashboardSummaryInput) {
  const seasonExpenses = input.expenses.reduce((total, expense) => total + toNumber(expense.amount), 0);
  const salesSummary = input.sales.reduce(
    (summary, sale) => {
      const amounts = calculateSaleAmounts(sale);

      summary.expectedRevenue += amounts.netAmount;
      summary.receivable += amounts.receivableAmount;

      return summary;
    },
    {
      expectedRevenue: 0,
      receivable: 0
    }
  );

  return {
    activeCropSeasons: input.activeCropSeasons,
    dailyReports: {
      submitted: input.submittedDailyReports,
      due: input.dueDailyReports,
      pending: Math.max(input.dueDailyReports - input.submittedDailyReports, 0)
    },
    seasonExpenses,
    expectedRevenue: salesSummary.expectedRevenue,
    profitEstimate: salesSummary.expectedRevenue - seasonExpenses,
    receivable: salesSummary.receivable,
    lowStockCount: input.lowStockItems.length,
    presentWorkers: input.presentWorkers,
    wagesToday: input.wagesToday
  };
}
