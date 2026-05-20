import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getCropSeasonById, type AccessContext } from "@/server/queries/crop-seasons.queries";
import { getCropSeasonTimeline } from "@/server/services/crop-seasons/listing.service";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function dateLabel(value: Date | null) {
  return value ? value.toLocaleDateString("en-PK", { dateStyle: "medium" }) : "Not set";
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function cropTypeLabel(value: string) {
  return value.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

export default async function CropSeasonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader eyebrow="Crop Seasons" title="Crop Season" description="View crop season details, summaries, and activity." />
        <Panel className="mt-5">
          <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Sign in to view crop season details.</p>
        </Panel>
      </AppShell>
    );
  }

  const season = await getCropSeasonById(id, access);

  if (!season) {
    notFound();
  }

  const actualYield = season.harvests.reduce((total, harvest) => total + Number(harvest.quantity), 0);
  const expenseTotal = season.expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const revenueTotal = season.sales.reduce((total, sale) => total + Number(sale.quantity) * Number(sale.unitPrice), 0);
  const receivedTotal = season.sales.reduce((total, sale) => total + Number(sale.received), 0);
  const timeline = getCropSeasonTimeline(season);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/crop-seasons" className="text-sm font-semibold text-emerald-800 hover:underline">
            Back to crop seasons
          </Link>
          <Link href={`/crop-seasons/${season.id}/edit`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Edit Crop Season
          </Link>
        </div>
        <PageHeader
          eyebrow="Crop Season Detail"
          title={season.cropName}
          description={`${season.block.farm.name} / ${season.block.name}${season.variety ? ` / ${season.variety}` : ""}`}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Crop type" value={cropTypeLabel(season.cropType)} helper={season.status} />
          <StatCard label={season.cropType === "CROP" ? "Sowing date" : "Planting date"} value={dateLabel(season.startDate)} helper="Start date" />
          <StatCard
            label={season.cropType === "TREE" ? "Yearly harvest" : "Harvesting date"}
            value={season.cropType === "TREE" ? season.harvestTiming ?? "Not set" : dateLabel(season.endDate)}
            helper={season.cropType === "CROP" ? "Target close date" : "Crop-type schedule"}
          />
          <StatCard label="Actual yield" value={numberLabel(actualYield)} helper="Recorded harvest quantity" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Harvest Summary">
            <p className="flex justify-between text-sm"><span>Harvest entries</span><strong>{season.harvests.length}</strong></p>
            <p className="mt-3 flex justify-between text-sm"><span>Actual yield</span><strong>{numberLabel(actualYield)}</strong></p>
          </Panel>
          <Panel title="Expense Summary">
            <p className="flex justify-between text-sm"><span>Expense entries</span><strong>{season.expenses.length}</strong></p>
            <p className="mt-3 flex justify-between text-sm"><span>Total expenses</span><strong>PKR {numberLabel(expenseTotal)}</strong></p>
          </Panel>
          <Panel title="Sales Summary">
            <p className="flex justify-between text-sm"><span>Revenue</span><strong>PKR {numberLabel(revenueTotal)}</strong></p>
            <p className="mt-3 flex justify-between text-sm"><span>Received</span><strong>PKR {numberLabel(receivedTotal)}</strong></p>
          </Panel>
        </div>
        <Panel title="Lifecycle Stage">
          <div className="grid gap-2 text-center text-xs font-semibold text-slate-600 sm:grid-cols-4">
            {timeline.map((stage) => (
              <div key={stage.label} className="rounded-md border border-slate-200 bg-white p-3">
                <div className={`mx-auto mb-2 h-3 w-3 rounded-full ${stage.complete ? "bg-emerald-700" : "bg-slate-300"}`} />
                {stage.label}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Activity Timeline">
          <DataTable
            columns={["Date", "Status", "Notes"]}
            rows={season.reports.map((report) => [
              dateLabel(report.reportDate),
              report.submittedAt ? <StatusBadge key="submitted">Submitted</StatusBadge> : <StatusBadge key="draft" tone="amber">Draft</StatusBadge>,
              report.notes || "Daily report submitted."
            ])}
          />
          {season.reports.length === 0 ? <p className="mt-4 text-sm text-slate-600">No daily report activity recorded yet.</p> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
