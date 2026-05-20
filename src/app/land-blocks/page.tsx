import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getLandBlocks, type AccessContext } from "@/server/queries/farms.queries";
import { filterLandBlockSummaries, getLandBlockListSummary, type SeasonStateFilter } from "@/server/services/farms/listing.service";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    seasonState?: string;
  }>;
};

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function seasonStateFilter(value: string | undefined): SeasonStateFilter {
  return value === "active" || value === "idle" ? value : "all";
}

export default async function Page({ searchParams }: PageProps) {
  const filters = (await searchParams) ?? {};
  const query = filters.q ?? "";
  const seasonState = seasonStateFilter(filters.seasonState);
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <main className="p-6">
          <PageHeader eyebrow="Land Blocks" title="Block-Level Land View" description="Sign in to inspect farm land blocks." />
        </main>
      </AppShell>
    );
  }

  const blocks = await getLandBlocks(access);
  const visibleBlocks = filterLandBlockSummaries(blocks, { query, seasonState });
  const summary = getLandBlockListSummary(visibleBlocks);

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Land Blocks"
          title="Block-Level Land View"
          description="Inspect block area, farm links, active crop seasons, and operational status."
          action={
            <Link href="/land-blocks/new" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Add Block
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Mapped blocks" value={String(summary.blockCount)} helper="Across accessible farms" />
          <StatCard label="Mapped acreage" value={`${numberLabel(summary.totalArea)} Acres`} helper="From block records" />
          <StatCard label="Active crop blocks" value={String(summary.activeBlockCount)} helper="Blocks with active seasons" />
        </div>

        <Panel title="Filters">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/land-blocks">
            <input name="q" defaultValue={query} placeholder="Search block or farm" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <select name="seasonState" defaultValue={seasonState} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="all">All blocks</option>
              <option value="active">Has active season</option>
              <option value="idle">No active season</option>
            </select>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">
              Apply
            </button>
          </form>
        </Panel>

        <Panel title="Land Blocks">
          <DataTable
            columns={["Block", "Farm", "Area", "Crop Seasons", "Status", "Action"]}
            rows={visibleBlocks.map((block) => [
              block.name,
              <Link key={block.farmId} href={`/farms/${block.farmId}`} className="font-medium text-emerald-800 hover:underline">
                {block.farm.name}
              </Link>,
              block.areaAcres ? `${numberLabel(block.areaAcres)} Acres` : "Not set",
              String(block.seasons.length),
              block.seasons.some((season) => season.status === "ACTIVE") ? <StatusBadge key="active">Active</StatusBadge> : <StatusBadge key="idle" tone="slate">Idle</StatusBadge>,
              <Link key={`${block.id}-edit`} href={`/land-blocks/${block.id}/edit`} className="font-medium text-emerald-800 hover:underline">
                Edit
              </Link>
            ])}
          />
          {visibleBlocks.length === 0 ? <p className="mt-4 text-sm text-slate-600">No land blocks match the current filters.</p> : null}
        </Panel>
      </main>
    </AppShell>
  );
}
