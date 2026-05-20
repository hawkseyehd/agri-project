import { FileSpreadsheet } from "lucide-react";

import { AiInsightPanel } from "@/components/ai/AiInsightPanel";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getReportsPageData, type ReportFilters, type ReportsAccessContext } from "@/server/queries/reports/reports.queries";
import { explainReportTotals } from "@/server/services/ai";

type PageProps = {
  searchParams?: Promise<{
    farmId?: string;
    cropSeasonId?: string;
  }>;
};

function getAccessContext(sessionUser: unknown): ReportsAccessContext | null {
  const user = sessionUser as Partial<ReportsAccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function moneyLabel(value: unknown) {
  return `PKR ${numberLabel(value)}`;
}

function cleanFilters(filters: { farmId?: string; cropSeasonId?: string }): ReportFilters {
  return {
    farmId: filters.farmId || undefined,
    cropSeasonId: filters.cropSeasonId || undefined
  };
}

export default async function Page({ searchParams }: PageProps) {
  const rawFilters = (await searchParams) ?? {};
  const filters = cleanFilters(rawFilters);
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="09 Reports"
          title="Reports and Exports"
          description="Sign in to generate financial, operational, crop, inventory, labor, and sales reports."
        />
      </AppShell>
    );
  }

  const data = await getReportsPageData(access, filters);
  const totals = data.profitLossRows.reduce(
    (summary, row) => {
      summary.expenses += row.expenses;
      summary.revenue += row.revenue;
      summary.profitLoss += row.profitLoss;
      summary.receivable += row.receivable;
      return summary;
    },
    {
      expenses: 0,
      revenue: 0,
      profitLoss: 0,
      receivable: 0
    }
  );
  const aiExplanation = await explainReportTotals({ rows: data.profitLossRows });
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(data.csv)}`;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="09 Reports"
          title="Reports and Exports"
          description="Generate filtered profit/loss, revenue, receivable, and crop-season financial reports."
          action={
            <a
              href={csvHref}
              download="profit-loss-report.csv"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" /> Export CSV
            </a>
          }
        />
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Revenue" value={moneyLabel(totals.revenue)} helper={`${data.profitLossRows.length} crop seasons`} />
          <StatCard label="Expenses" value={moneyLabel(totals.expenses)} helper="Filtered total" />
          <StatCard label="Profit / Loss" value={moneyLabel(totals.profitLoss)} helper="Revenue minus expenses" />
          <StatCard label="Receivable" value={moneyLabel(totals.receivable)} helper="Pending collections" />
        </div>
        <Panel title="AI Report Explanation">
          <AiInsightPanel
            title="Plain-language notes"
            summary={aiExplanation.summary}
            items={[...aiExplanation.highlights, ...aiExplanation.watchouts].slice(0, 5)}
            footer="This explanation is based on filtered report totals and does not change records."
          />
        </Panel>
        <Panel title="Filters">
          <form className="grid gap-3 md:grid-cols-[220px_1fr_auto]" action="/reports">
            <select name="farmId" defaultValue={filters.farmId ?? ""} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">All farms</option>
              {data.farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
            <select
              name="cropSeasonId"
              defaultValue={filters.cropSeasonId ?? ""}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All crop seasons</option>
              {data.cropSeasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.cropName} - {season.block.farm.name} / {season.block.name}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">
              Apply
            </button>
          </form>
        </Panel>
        <Panel title="Profit / Loss Report">
          <DataTable
            columns={["Farm", "Block", "Crop Season", "Expenses", "Revenue", "Profit / Loss", "Receivable"]}
            rows={data.profitLossRows.map((row) => [
              row.farmName,
              row.blockName,
              row.cropSeasonName,
              moneyLabel(row.expenses),
              moneyLabel(row.revenue),
              moneyLabel(row.profitLoss),
              moneyLabel(row.receivable)
            ])}
          />
          {data.profitLossRows.length === 0 ? <p className="mt-4 text-sm text-slate-600">No report rows match the current filters.</p> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
