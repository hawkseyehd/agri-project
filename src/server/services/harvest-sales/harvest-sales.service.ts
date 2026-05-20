export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING";

export type SaleAmountInput = {
  quantity: number;
  unitPrice: number;
  received: number;
};

export type HarvestSalesSummaryInput = {
  harvests: Array<{ quantity: number | string }>;
  sales: Array<SaleAmountInput>;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

export function calculateSaleAmounts(input: SaleAmountInput) {
  const grossAmount = input.quantity * input.unitPrice;
  const netAmount = grossAmount;
  const receivableAmount = Math.max(netAmount - input.received, 0);
  const paymentStatus: PaymentStatus =
    receivableAmount === 0 ? "PAID" : input.received > 0 ? "PARTIAL" : "PENDING";

  return {
    grossAmount,
    netAmount,
    receivableAmount,
    paymentStatus
  };
}

export function summarizeHarvestSales(input: HarvestSalesSummaryInput) {
  const totalHarvested = input.harvests.reduce((total, harvest) => total + toNumber(harvest.quantity), 0);

  return input.sales.reduce(
    (summary, sale) => {
      const amounts = calculateSaleAmounts(sale);

      summary.totalSold += sale.quantity;
      summary.totalRevenue += amounts.netAmount;
      summary.receivable += amounts.receivableAmount;

      return summary;
    },
    {
      totalHarvested,
      totalSold: 0,
      totalRevenue: 0,
      receivable: 0,
      harvestCount: input.harvests.length,
      salesCount: input.sales.length
    }
  );
}
