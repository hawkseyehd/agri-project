import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Field, PageHeader, Panel, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getSuperAdminFarmList } from "@/server/queries/super-admin.queries";

function moneyLabel(value: number) {
  return `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export default async function SuperAdminFarmsPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const farms = await getSuperAdminFarmList();
  const totals = farms.reduce(
    (result, farm) => ({
      revenue: result.revenue + farm.financials.revenue,
      expenses: result.expenses + farm.financials.expenses,
      netProfit: result.netProfit + farm.financials.netProfit
    }),
    { revenue: 0, expenses: 0, netProfit: 0 }
  );

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Platform Farms"
          title="Farm Access"
          description="Review farms across tenants and open a farm-scoped dashboard when you need operational detail."
          action={
            <Link href="/super-admin" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              SaaS Dashboard
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="Total Revenue">
            <p className="text-2xl font-bold text-slate-950">{moneyLabel(totals.revenue)}</p>
            <p className="mt-1 text-sm text-slate-500">Calculated from harvest/sales records</p>
          </Panel>
          <Panel title="Total Expenses">
            <p className="text-2xl font-bold text-slate-950">{moneyLabel(totals.expenses)}</p>
            <p className="mt-1 text-sm text-slate-500">All recorded farm expenses</p>
          </Panel>
          <Panel title="Net Profit">
            <p className={`text-2xl font-bold ${totals.netProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>{moneyLabel(totals.netProfit)}</p>
            <p className="mt-1 text-sm text-slate-500">Revenue after all expenses</p>
          </Panel>
        </div>

        <Panel title="All Farms">
          <DataTable
            columns={["Farm", "Company", "Owner", "Revenue", "Expenses", "Net Profit", "Blocks", "Records", "Access"]}
            rows={farms.map((farm) => [
              <div key={`${farm.id}-name`}>
                <p className="font-semibold text-slate-900">{farm.name}</p>
                <p className="text-xs text-slate-500">{farm.location || farm.address || "No location set"}</p>
              </div>,
              farm.owner?.companyName ?? "No company name",
              farm.owner?.name ?? "No land owner assigned",
              moneyLabel(farm.financials.revenue),
              moneyLabel(farm.financials.expenses),
              <StatusBadge key={`${farm.id}-profit`} tone={farm.financials.netProfit >= 0 ? "green" : "red"}>
                {moneyLabel(farm.financials.netProfit)}
              </StatusBadge>,
              <StatusBadge key={`${farm.id}-blocks`}>{farm.blocks.length}</StatusBadge>,
              <div key={`${farm.id}-records`} className="grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
                <Field label="Expenses" value={String(farm.expenses.length)} />
                <Field label="Inventory" value={String(farm.items.length)} />
                <Field label="Workers" value={String(farm.workers.length)} />
              </div>,
              <div key={`${farm.id}-links`} className="flex flex-wrap gap-2">
                <Link href={`/dashboard?farmId=${farm.id}`} className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
                  Dashboard
                </Link>
                <Link href={`/farms/${farm.id}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Record
                </Link>
              </div>
            ])}
          />
          {farms.length === 0 ? <p className="mt-4 text-sm text-slate-600">No farms have been created yet.</p> : null}
        </Panel>
      </main>
    </AppShell>
  );
}
