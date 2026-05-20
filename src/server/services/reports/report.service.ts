import { calculateSaleAmounts, type SaleAmountInput } from "@/server/services/harvest-sales/harvest-sales.service";

export type ProfitLossSourceRow = {
  farmName: string;
  blockName: string;
  cropSeasonName: string;
  expenses: Array<{ amount: number | string }>;
  sales: SaleAmountInput[];
};

export type CsvColumn<TRow extends Record<string, unknown>> = {
  key: keyof TRow;
  label: string;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

export function buildProfitLossRows(rows: ProfitLossSourceRow[]) {
  return rows.map((row) => {
    const expenses = row.expenses.reduce((total, expense) => total + toNumber(expense.amount), 0);
    const sales = row.sales.reduce(
      (summary, sale) => {
        const amounts = calculateSaleAmounts(sale);

        summary.revenue += amounts.netAmount;
        summary.receivable += amounts.receivableAmount;

        return summary;
      },
      {
        revenue: 0,
        receivable: 0
      }
    );

    return {
      farmName: row.farmName,
      blockName: row.blockName,
      cropSeasonName: row.cropSeasonName,
      expenses,
      revenue: sales.revenue,
      profitLoss: sales.revenue - expenses,
      receivable: sales.receivable
    };
  });
}

function escapeCsvValue(value: unknown) {
  const stringValue = value === null || value === undefined ? "" : String(value);

  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function toCsv<TRow extends Record<string, unknown>>(columns: Array<CsvColumn<TRow>>, rows: TRow[]) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(","));

  return [header, ...body].join("\r\n");
}
