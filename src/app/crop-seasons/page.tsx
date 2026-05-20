import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getCropSeasons, type AccessContext } from "@/server/queries/crop-seasons.queries";
import {
  filterCropSeasonSummaries,
  getCropSeasonListSummary,
  type CropSeasonStatusFilter
} from "@/server/services/crop-seasons/listing.service";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function dateLabel(value: Date | null) {
  return value ? value.toLocaleDateString("en-PK", { dateStyle: "medium" }) : "Not set";
}

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function cropTypeLabel(value: string) {
  return value.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function statusFilter(value: string | undefined): CropSeasonStatusFilter {
  return value === "PLANNED" || value === "ACTIVE" || value === "HARVESTED" || value === "CLOSED" ? value : "ALL";
}

export default async function Page({ searchParams }: PageProps) {
  const filters = (await searchParams) ?? {};
  const query = filters.q ?? "";
  const status = statusFilter(filters.status);
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="03 Crop Seasons"
          title="Crop Seasons"
          description="Track crop cycles by farm, land block, status, sowing date, harvest, and yield."
        />
        <Panel className="mt-5">
          <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Sign in to view crop seasons.</p>
        </Panel>
      </AppShell>
    );
  }

  const seasons = await getCropSeasons(access);
  const visibleSeasons = filterCropSeasonSummaries(seasons, { query, status });
  const summary = getCropSeasonListSummary(visibleSeasons);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="03 Crop Seasons"
          title="Crop Seasons"
          description="Track crop cycles by farm, land block, status, sowing date, harvest, yield, and active stage."
          action={
            <Link href="/crop-seasons/new" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              New Crop Season
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Visible seasons" value={numberLabel(summary.seasonCount)} helper={`${summary.activeSeasonCount} active`} />
          <StatCard label="Primary crop" value={summary.primaryCrop} helper="From visible seasons" />
          <StatCard label="Next harvest" value={dateLabel(summary.nearestHarvestDate)} helper="Nearest expected date" />
          <StatCard label="Actual yield" value={numberLabel(summary.actualYield)} helper={`PKR ${numberLabel(summary.expenseTotal)} expenses`} />
        </div>
        <Panel title="Filters">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/crop-seasons">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search crop, variety, farm, or block"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select name="status" defaultValue={status} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="ALL">All statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="HARVESTED">Harvested</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">
              Apply
            </button>
          </form>
        </Panel>
        <Panel title="Crop Seasons">
          <DataTable
            columns={["Crop", "Type", "Farm / Block", "Stage", "Start", "Harvest", "Actual Yield", "Expenses"]}
            rows={visibleSeasons.map((season) => {
              const actualYield = season.harvests.reduce((total, harvest) => total + Number(harvest.quantity), 0);
              const expenses = season.expenses.reduce((total, expense) => total + Number(expense.amount), 0);

              return [
                <Link key={season.id} href={`/crop-seasons/${season.id}`} className="font-semibold text-emerald-800 hover:underline">
                  {season.cropName}
                  {season.variety ? <span className="block text-xs font-normal text-slate-500">{season.variety}</span> : null}
                </Link>,
                cropTypeLabel(season.cropType),
                `${season.block.farm.name} / ${season.block.name}`,
                <StatusBadge key="status">{season.status}</StatusBadge>,
                dateLabel(season.startDate),
                season.cropType === "TREE" ? season.harvestTiming ?? "Not set" : dateLabel(season.endDate),
                numberLabel(actualYield),
                `PKR ${numberLabel(expenses)}`
              ];
            })}
          />
          {visibleSeasons.length === 0 ? <p className="mt-4 text-sm text-slate-600">No crop seasons match the current filters.</p> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
