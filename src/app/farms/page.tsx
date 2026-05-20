import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { canManageTenant } from "@/server/auth/permissions";
import { getFarms, type AccessContext } from "@/server/queries/farms.queries";
import { filterFarmSummaries, getFarmListSummary, type SeasonStateFilter } from "@/server/services/farms/listing.service";

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
          <PageHeader eyebrow="02 Farms & Land" title="Farms" description="Sign in to view farm records and assigned land blocks." />
        </main>
      </AppShell>
    );
  }

  const farms = await getFarms(access);
  const visibleFarms = filterFarmSummaries(farms, { query, seasonState });
  const summary = getFarmListSummary(visibleFarms);
  const canManageFarms = canManageTenant(access.role);

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="02 Farms & Land"
          title="Farms"
          description="Manage farm locations, assigned managers, land blocks, acreage, and crop-season coverage."
          action={
            canManageFarms ? (
              <Link href="/farms/new" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Add Farm
              </Link>
            ) : undefined
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Visible farms" value={String(summary.farmCount)} helper={canManageFarms ? "All farms" : "Assigned farms"} />
          <StatCard label="Total acreage" value={`${numberLabel(summary.totalArea)} Acres`} helper="From mapped blocks" />
          <StatCard label="Active seasons" value={String(summary.activeSeasonCount)} helper={`${summary.blockCount} land blocks`} />
        </div>

        <Panel title="Filters">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/farms">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search farm, address, location, or manager"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
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

        <Panel title="Farm Records">
          <DataTable
            columns={["Farm Name", "Address", "Area", "Type", "Blocks", "Managers", "Status"]}
            rows={visibleFarms.map((farm) => [
              <Link key={farm.id} href={`/farms/${farm.id}`} className="font-semibold text-emerald-800 hover:underline">
                {farm.name}
              </Link>,
              farm.address || farm.location || "Not set",
              `${numberLabel(farm.area)} Acres`,
              farm.type === "OWNER" ? "Owner" : farm.type === "CONTRACTOR" ? "Contractor" : "Lease",
              String(farm.blocks.length),
              farm.managers.length > 0 ? farm.managers.map((assignment) => assignment.manager.name).join(", ") : "Unassigned",
              <StatusBadge key={`${farm.id}-status`}>Active</StatusBadge>
            ])}
          />
          {visibleFarms.length === 0 ? <p className="mt-4 text-sm text-slate-600">No farms match the current filters.</p> : null}
        </Panel>
      </main>
    </AppShell>
  );
}
