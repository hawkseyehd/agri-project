import { redirect } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { Field, PageHeader, Panel, StatCard } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getSuperAdminDashboardData, type SuperAdminDateRange } from "@/server/queries/super-admin.queries";

function parseDateRange(searchParams?: { from?: string; to?: string; month?: string; year?: string }): SuperAdminDateRange {
  if (searchParams?.month) {
    const from = new Date(`${searchParams.month}-01T00:00:00`);
    if (!Number.isNaN(from.getTime())) {
      const to = new Date(from);
      to.setMonth(to.getMonth() + 1);
      return { from, to };
    }
  }

  if (searchParams?.year) {
    const year = Number(searchParams.year);
    if (Number.isInteger(year) && year > 2000) {
      return {
        from: new Date(year, 0, 1),
        to: new Date(year + 1, 0, 1)
      };
    }
  }

  const from = searchParams?.from ? new Date(`${searchParams.from}T00:00:00`) : undefined;
  const to = searchParams?.to ? new Date(`${searchParams.to}T00:00:00`) : undefined;
  if (to && !Number.isNaN(to.getTime())) {
    to.setDate(to.getDate() + 1);
  }

  return {
    ...(from && !Number.isNaN(from.getTime()) ? { from } : {}),
    ...(to && !Number.isNaN(to.getTime()) ? { to } : {})
  };
}

function moneyLabel(value: number) {
  return `$${value.toLocaleString("en-US")}/mo`;
}

export default async function SuperAdminPage({ searchParams }: { searchParams?: { from?: string; to?: string; month?: string; year?: string } }) {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const data = await getSuperAdminDashboardData(parseDateRange(searchParams));
  const metrics = data.metrics;

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Platform"
          title="SaaS Dashboard"
          description="Track registrations, plans, estimated recurring revenue, farm coverage, and platform-wide activity."
          action={
            <Link href="/super-admin/farms" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              View Farms
            </Link>
          }
        />

        <Panel title="Date Filters">
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              Month
              <input name="month" type="month" defaultValue={searchParams?.month ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              Year
              <input name="year" type="number" min="2020" defaultValue={searchParams?.year ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              From
              <input name="from" type="date" defaultValue={searchParams?.from ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              To
              <input name="to" type="date" defaultValue={searchParams?.to ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700" />
            </label>
            <div className="flex items-end">
              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Apply
              </button>
            </div>
          </form>
        </Panel>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Registered users" value={String(metrics.totalUsers)} helper={`${data.pendingUsers.length} pending in range`} />
          <StatCard label="Active premium users" value={String(metrics.premiumUsers)} helper={`${metrics.nonPremiumUsers} non-premium`} />
          <StatCard label="MRR estimate" value={moneyLabel(metrics.monthlyRecurringRevenue)} helper="Approved paid plans" />
          <StatCard label="Farms" value={String(metrics.totalFarms)} helper={`${metrics.usersWithoutFarms} users without farms`} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Silver" value={String(metrics.planCounts.SILVER)} helper="$10/month" />
          <StatCard label="Gold" value={String(metrics.planCounts.GOLD)} helper="$25/month" />
          <StatCard label="Platinum" value={String(metrics.planCounts.PLATINUM)} helper="$50/month" />
          <StatCard label="No plan" value={String(metrics.planCounts.NONE)} helper="Not premium" />
        </div>

        <Panel title="Platform Activity Totals">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Reports" value={String(metrics.operationalCounts.reports)} />
            <Field label="Blocks" value={String(metrics.operationalCounts.landBlocks)} />
            <Field label="Crop seasons" value={String(metrics.operationalCounts.cropSeasons)} />
            <Field label="Expenses" value={String(metrics.operationalCounts.expenses)} />
            <Field label="Inventory items" value={String(metrics.operationalCounts.inventoryItems)} />
            <Field label="Inventory moves" value={String(metrics.operationalCounts.inventoryMovements)} />
            <Field label="Labor records" value={String(metrics.operationalCounts.laborAttendance)} />
            <Field label="Workers" value={String(metrics.operationalCounts.workers)} />
            <Field label="Harvests" value={String(metrics.operationalCounts.harvests)} />
            <Field label="Yields" value={String(metrics.operationalCounts.yields)} />
            <Field label="Sales" value={String(metrics.operationalCounts.sales)} />
          </div>
        </Panel>
      </main>
    </AppShell>
  );
}
