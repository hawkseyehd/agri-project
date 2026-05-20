import type { Role } from "@prisma/client";

import { ReceiptExtractionAssistant } from "@/components/ai/ReceiptExtractionAssistant";
import { AppShell } from "@/components/layout/AppShell";
import { FileUpload } from "@/components/ui/FileUpload";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { createExpenseAction } from "@/server/actions/expenses.actions";
import { auth } from "@/server/auth/auth";
import { getExpenses, getExpenseSummary } from "@/server/queries/expenses.queries";
import { getFarms } from "@/server/queries/farms.queries";

type SessionUser = {
  role?: Role;
  assignedFarmIds?: string[];
};

async function getAccessContext() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.role) {
    return undefined;
  }

  return {
    role: user.role,
    assignedFarmIds: user.assignedFarmIds ?? []
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    currency: "PKR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}

async function createExpenseFromForm(formData: FormData): Promise<void> {
  "use server";

  void (await createExpenseAction({ ok: false }, formData));
}

export default async function Page() {
  const context = await getAccessContext();

  if (!context) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="06 Expenses"
          title="Expense Tracking"
          description="Monitor farm spending by category, block, vendor, payment status, and date range."
        />
        <Panel className="mt-5">
          <p className="text-sm text-slate-600">Sign in to manage expenses.</p>
        </Panel>
      </AppShell>
    );
  }

  const [expenseRows, summary, farms] = await Promise.all([getExpenses(context), getExpenseSummary(context), getFarms(context)]);
  const activeSeasons = farms.flatMap((farm) =>
    farm.blocks.flatMap((block) =>
      block.seasons.map((season) => ({
        ...season,
        blockName: block.name,
        farmId: farm.id,
        farmName: farm.name
      }))
    )
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="06 Expenses"
          title="Expense Tracking"
          description="Monitor farm spending by category, block, vendor, payment status, and date range."
        />
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total expenses" value={formatCurrency(summary.total)} helper={`${summary.count} records`} />
          <StatCard label="Paid" value={formatCurrency(summary.paid)} helper="Settled expenses" />
          <StatCard label="Unpaid" value={formatCurrency(summary.unpaid)} helper="Pending and partial" />
          <StatCard label="Linked receipts" value={String(expenseRows.filter((expense) => expense.receiptPath).length)} helper="Uploaded files" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Panel title="Expense Ledger">
            {expenseRows.length > 0 ? (
              <DataTable
                columns={["Date", "Farm", "Block", "Crop", "Category", "Amount", "Status", "Receipt"]}
                rows={expenseRows.map((expense) => [
                  formatDate(expense.expenseDate),
                  expense.farm.name,
                  expense.cropSeason?.block.name ?? "General",
                  expense.cropSeason?.cropName ?? "-",
                  expense.category,
                  formatCurrency(Number(expense.amount)),
                  <StatusBadge key={`${expense.id}-status`} tone={expense.paymentStatus === "PAID" ? "green" : "amber"}>
                    {expense.paymentStatus}
                  </StatusBadge>,
                  expense.receiptPath ? "Attached" : "-"
                ])}
              />
            ) : (
              <p className="text-sm text-slate-500">No expenses have been recorded yet.</p>
            )}
          </Panel>

          <div className="space-y-4">
            <Panel title="AI Receipt Helper">
              <ReceiptExtractionAssistant farms={farms} />
            </Panel>
            <Panel title="Add Expense">
              <form action={createExpenseFromForm} className="space-y-4">
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Farm
                <select name="farmId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
                  <option value="">Select farm</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Crop season
                <select name="cropSeasonId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="">General farm expense</option>
                  {activeSeasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.cropName} - {season.farmName} / {season.blockName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-1 text-sm font-medium text-slate-700">
                  Category
                  <input name="category" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block space-y-1 text-sm font-medium text-slate-700">
                  Amount
                  <input name="amount" type="number" min="0.01" step="0.01" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-1 text-sm font-medium text-slate-700">
                  Status
                  <select name="paymentStatus" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </label>
                <label className="block space-y-1 text-sm font-medium text-slate-700">
                  Date
                  <input name="expenseDate" type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Receipt
                <FileUpload name="receiptPath" />
              </label>
                <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                  Save expense
                </button>
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
