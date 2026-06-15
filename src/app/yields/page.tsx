import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getYieldPageData, type YieldAccessContext } from "@/server/queries/yields.queries";
import { yieldFilterSchema } from "@/server/validators/yield.schema";

function getAccessContext(sessionUser: unknown): YieldAccessContext | null {
  const user = sessionUser as Partial<YieldAccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function parseFilters(searchParams?: Record<string, string | undefined>) {
  const parsed = yieldFilterSchema.safeParse({
    from: searchParams?.from,
    to: searchParams?.to,
    cropName: searchParams?.cropName,
    district: searchParams?.district,
    city: searchParams?.city
  });

  return parsed.success ? parsed.data : {};
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
}

function dateLabel(value: Date) {
  return value.toLocaleDateString("en-PK", { dateStyle: "medium" });
}

export default async function YieldsPage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader eyebrow="Yield Tracking" title="Yields" description="Sign in to review crop yield generated from completed harvest records." />
      </AppShell>
    );
  }

  const filters = parseFilters(searchParams);
  const data = await getYieldPageData(access, filters);
  const topDistrict = data.summary.byDistrict[0];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Yield Tracking"
          title="Yields"
          description="Track crop yield by farm, block, date, and location. Yield records are created when harvests are recorded."
          action={
            <Link href="/harvest-sales" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Record Harvest
            </Link>
          }
        />

        <Panel title="Filters">
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              From
              <input name="from" type="date" defaultValue={searchParams?.from ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              To
              <input name="to" type="date" defaultValue={searchParams?.to ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              Crop
              <input name="cropName" defaultValue={searchParams?.cropName ?? ""} placeholder="Mango" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              District
              <input name="district" defaultValue={searchParams?.district ?? ""} placeholder="Multan" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              City
              <input name="city" defaultValue={searchParams?.city ?? ""} placeholder="City" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <div className="flex items-end">
              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Apply
              </button>
            </div>
          </form>
        </Panel>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total yield" value={numberLabel(data.summary.totals.quantity)} helper={`${data.summary.totals.recordCount} yield records`} />
          <StatCard label="Farms" value={String(data.summary.totals.farmCount)} helper="Producing farms in range" />
          <StatCard label="Owners" value={String(data.summary.totals.ownerCount)} helper="Land owners represented" />
          <StatCard label="Top area" value={topDistrict?.district ?? "None"} helper={topDistrict ? `${numberLabel(topDistrict.totalQuantity)} ${topDistrict.unit} ${topDistrict.cropName}` : "No yield yet"} />
        </div>

        <Panel title="Yield by District">
          <DataTable
            columns={["Crop", "District", "Total Yield", "Unit", "Farms", "Owners", "Records"]}
            rows={data.summary.byDistrict.map((group) => [
              group.cropName,
              group.district,
              numberLabel(group.totalQuantity),
              group.unit,
              String(group.farmCount),
              String(group.ownerCount),
              String(group.recordCount)
            ])}
          />
          {data.summary.byDistrict.length === 0 ? <p className="mt-4 text-sm text-slate-600">No yield records match these filters.</p> : null}
        </Panel>

        <Panel title="Yield Records">
          <DataTable
            columns={["Date", "Crop", "Farm / Block", "Quantity", "Unit", "District", "Owner", "Notes"]}
            rows={data.records.map((record) => [
              dateLabel(record.yieldDate),
              record.cropName,
              `${record.farmName} / ${record.landBlock.name}`,
              numberLabel(record.quantity),
              record.unit,
              record.district ?? record.city ?? "Not set",
              record.owner?.name ?? "No owner",
              record.notes ?? "None"
            ])}
          />
          {data.records.length === 0 ? <p className="mt-4 text-sm text-slate-600">Record a harvest to create yield data.</p> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
