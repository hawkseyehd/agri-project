import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getSuperAdminYieldData } from "@/server/queries/yields.queries";
import { yieldFilterSchema } from "@/server/validators/yield.schema";

function parseFilters(searchParams?: Record<string, string | undefined>) {
  const parsed = yieldFilterSchema.safeParse({
    from: searchParams?.from,
    to: searchParams?.to,
    cropName: searchParams?.cropName,
    district: searchParams?.district,
    city: searchParams?.city,
    ownerId: searchParams?.ownerId,
    farmId: searchParams?.farmId
  });

  return parsed.success ? parsed.data : {};
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
}

function dateLabel(value: Date) {
  return value.toLocaleDateString("en-PK", { dateStyle: "medium" });
}

export default async function SuperAdminYieldsPage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const filters = parseFilters(searchParams);
  const data = await getSuperAdminYieldData(filters);
  const topDistrict = data.summary.byDistrict[0];

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Platform Yields"
          title="Yield Aggregation"
          description="Track crop yield across owners, farms, cities, districts, and selected date ranges."
          action={
            <Link href="/super-admin" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              SaaS Dashboard
            </Link>
          }
        />

        <Panel title="Filters">
          <form className="grid gap-3 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]">
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
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              Owner
              <select name="ownerId" defaultValue={searchParams?.ownerId ?? ""} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700">
                <option value="">All owners</option>
                {data.owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.companyName ?? owner.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              Farm
              <select name="farmId" defaultValue={searchParams?.farmId ?? ""} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700">
                <option value="">All farms</option>
                {data.farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Apply
              </button>
            </div>
          </form>
        </Panel>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total yield" value={numberLabel(data.summary.totals.quantity)} helper={`${data.summary.totals.recordCount} records in range`} />
          <StatCard label="Farms" value={String(data.summary.totals.farmCount)} helper="Producing farms" />
          <StatCard label="Owners" value={String(data.summary.totals.ownerCount)} helper="Land owners represented" />
          <StatCard label="Top district" value={topDistrict?.district ?? "None"} helper={topDistrict ? `${numberLabel(topDistrict.totalQuantity)} ${topDistrict.unit} ${topDistrict.cropName}` : "No yield yet"} />
        </div>

        <Panel title="Aggregated Yield by District">
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
          {data.summary.byDistrict.length === 0 ? <p className="mt-4 text-sm text-slate-600">No yield data matches the current filters.</p> : null}
        </Panel>

        <Panel title="Yield Records">
          <DataTable
            columns={["Date", "Crop", "Owner", "Farm / Block", "Quantity", "Unit", "City", "District"]}
            rows={data.records.map((record) => [
              dateLabel(record.yieldDate),
              record.cropName,
              record.owner?.companyName ?? record.owner?.name ?? "No owner",
              `${record.farmName} / ${record.landBlock.name}`,
              numberLabel(record.quantity),
              record.unit,
              record.city ?? "Not set",
              record.district ?? "Not set"
            ])}
          />
          {data.records.length === 0 ? <p className="mt-4 text-sm text-slate-600">Yield records will appear after owners record harvests.</p> : null}
        </Panel>
      </main>
    </AppShell>
  );
}
