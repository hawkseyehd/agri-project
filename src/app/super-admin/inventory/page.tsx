import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Field, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getSuperAdminInventorySummary } from "@/server/queries/super-admin.queries";

function quantityLabel(value: unknown, unit: string) {
  return `${Number(value ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })} ${unit}`;
}

function itemTypeSummary(itemTypes: Record<string, number>) {
  const entries = Object.entries(itemTypes);
  if (entries.length === 0) {
    return "No inventory types";
  }

  return entries.map(([type, count]) => `${type}: ${count}`).join(", ");
}

export default async function SuperAdminInventoryPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const summaries = await getSuperAdminInventorySummary();
  const allItems = summaries.flatMap((summary) => summary.items.map((item) => ({ ...item, companyName: summary.companyName })));
  const lowStockItems = summaries.reduce((total, summary) => total + summary.lowStockItems.length, 0);

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Platform Inventory"
          title="Inventory Summary"
          description="Review inventory added across every company, grouped by farm owner and farm area."
          action={
            <Link href="/super-admin" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              SaaS Dashboard
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Companies" value={String(summaries.length)} helper="With or without inventory" />
          <StatCard label="Inventory items" value={String(allItems.length)} helper="Across all farms" />
          <StatCard label="Low stock" value={String(lowStockItems)} helper="At or below reorder level" />
          <StatCard label="Farms represented" value={String(summaries.reduce((total, summary) => total + summary.farms.length, 0))} helper="Owned farm areas" />
        </div>

        <Panel title="All Inventory Items">
          <DataTable
            columns={["Company", "Farm", "Item", "Type", "Quantity", "Low Stock", "Status"]}
            rows={allItems.map((item) => {
              const lowStock = Number(item.quantity ?? 0) <= Number(item.lowStockLevel ?? 0);

              return [
                item.companyName,
                item.farm.name,
                item.name,
                item.itemType,
                quantityLabel(item.quantity, item.unit),
                quantityLabel(item.lowStockLevel, item.unit),
                <StatusBadge key={`${item.id}-status`} tone={lowStock ? "red" : "green"}>
                  {lowStock ? "Low stock" : "In stock"}
                </StatusBadge>
              ];
            })}
          />
          {allItems.length === 0 ? <p className="mt-4 text-sm text-slate-600">No inventory has been added yet.</p> : null}
        </Panel>

        <div className="grid gap-4 xl:grid-cols-2">
          {summaries.map((summary) => (
            <Panel key={summary.owner.id} title={summary.companyName}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Farms" value={String(summary.farms.length)} />
                <Field label="Items" value={String(summary.items.length)} />
                <Field label="Low stock" value={String(summary.lowStockItems.length)} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{itemTypeSummary(summary.itemTypes)}</p>
              <div className="mt-4 space-y-2 text-sm">
                {summary.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.farm.name} - {item.itemType}
                      </p>
                    </div>
                    <StatusBadge tone={Number(item.quantity ?? 0) <= Number(item.lowStockLevel ?? 0) ? "red" : "green"}>{quantityLabel(item.quantity, item.unit)}</StatusBadge>
                  </div>
                ))}
                {summary.items.length === 0 ? <p className="text-sm text-slate-600">No inventory items for this company.</p> : null}
              </div>
            </Panel>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
