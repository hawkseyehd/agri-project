type MoneyValue = unknown;

type FarmFinancialInput = {
  expenses: Array<{
    amount: MoneyValue;
  }>;
  blocks: Array<{
    seasons: Array<{
      sales: Array<{
        quantity: MoneyValue;
        unitPrice: MoneyValue;
      }>;
    }>;
  }>;
};

function numberValue(value: MoneyValue) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function calculateFarmFinancials(farm: FarmFinancialInput) {
  const expenses = farm.expenses.reduce((total, expense) => total + numberValue(expense.amount), 0);
  const revenue = farm.blocks.reduce((farmTotal, block) => {
    return (
      farmTotal +
      block.seasons.reduce((seasonTotal, season) => {
        return seasonTotal + season.sales.reduce((salesTotal, sale) => salesTotal + numberValue(sale.quantity) * numberValue(sale.unitPrice), 0);
      }, 0)
    );
  }, 0);

  return {
    revenue,
    expenses,
    netProfit: revenue - expenses
  };
}
