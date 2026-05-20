import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { createHarvestAction } from "@/server/actions/harvests.actions";
import { createSaleAction } from "@/server/actions/sales.actions";
import { auth } from "@/server/auth/auth";
import { getHarvestSalesPageData, type HarvestSalesAccessContext } from "@/server/queries/harvest-sales/harvest-sales.queries";

function getAccessContext(sessionUser: unknown): HarvestSalesAccessContext | null {
  const user = sessionUser as Partial<HarvestSalesAccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function moneyLabel(value: unknown) {
  return `PKR ${numberLabel(value)}`;
}

function dateLabel(value: Date) {
  return value.toLocaleDateString("en-PK", { dateStyle: "medium" });
}

function paymentTone(status: string) {
  if (status === "PAID") {
    return "green" as const;
  }

  if (status === "PARTIAL") {
    return "amber" as const;
  }

  return "red" as const;
}

export default async function Page() {
  const session = await auth();
  const access = getAccessContext(session?.user);

  async function recordHarvest(formData: FormData) {
    "use server";

    await createHarvestAction({ ok: false }, formData);
  }

  async function recordSale(formData: FormData) {
    "use server";

    await createSaleAction({ ok: false }, formData);
  }

  if (!access) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="08 Harvest & Sales"
          title="Harvest and Sales"
          description="Sign in to record harvest quantities, buyer sales, payments, and receivables."
        />
      </AppShell>
    );
  }

  const data = await getHarvestSalesPageData(access);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="08 Harvest & Sales"
          title="Harvest and Sales"
          description="Record crop harvest quantities, storage movement, buyer sales, payments, and receivables."
        />
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total harvested" value={numberLabel(data.summary.totalHarvested)} helper={`${data.summary.harvestCount} harvest records`} />
          <StatCard label="Total sold" value={numberLabel(data.summary.totalSold)} helper={`${data.summary.salesCount} sales records`} />
          <StatCard label="Total revenue" value={moneyLabel(data.summary.totalRevenue)} helper="Booked sales" />
          <StatCard label="Receivable" value={moneyLabel(data.summary.receivable)} helper="Pending collection" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Record Harvest">
            <form action={recordHarvest} className="grid gap-3 md:grid-cols-2">
              <select name="cropSeasonId" required className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select crop season</option>
                {data.cropSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.cropName} - {season.block.farm.name} / {season.block.name}
                  </option>
                ))}
              </select>
              <input name="harvestDate" required type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="quantity" required placeholder="Quantity" inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="unit" required placeholder="Unit, e.g. Maund" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <textarea name="notes" placeholder="Notes" className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
              <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 md:col-span-2" type="submit">
                Save Harvest
              </button>
            </form>
          </Panel>
          <Panel title="Record Sale">
            <form action={recordSale} className="grid gap-3 md:grid-cols-2">
              <select name="cropSeasonId" required className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select crop season</option>
                {data.cropSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.cropName} - {season.block.farm.name} / {season.block.name}
                  </option>
                ))}
              </select>
              <select name="harvestId" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">No linked harvest</option>
                {data.harvests.map((harvest) => (
                  <option key={harvest.id} value={harvest.id}>
                    {dateLabel(harvest.harvestDate)} - {harvest.cropSeason.cropName} ({numberLabel(harvest.quantity)} {harvest.unit})
                  </option>
                ))}
              </select>
              <input name="buyerName" required placeholder="Buyer name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="saleDate" required type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="quantity" required placeholder="Quantity sold" inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="unitPrice" required placeholder="Unit price" inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="received" placeholder="Received amount" inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
              <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 md:col-span-2" type="submit">
                Save Sale
              </button>
            </form>
          </Panel>
        </div>
        <Panel title="Harvest Records">
          <DataTable
            columns={["Date", "Crop", "Farm / Block", "Qty Harvested", "Unit", "Notes"]}
            rows={data.harvests.map((harvest) => [
              dateLabel(harvest.harvestDate),
              harvest.cropSeason.cropName,
              `${harvest.cropSeason.block.farm.name} / ${harvest.cropSeason.block.name}`,
              numberLabel(harvest.quantity),
              harvest.unit,
              harvest.notes ?? "None"
            ])}
          />
          {data.harvests.length === 0 ? <p className="mt-4 text-sm text-slate-600">No harvest records yet.</p> : null}
        </Panel>
        <Panel title="Sales Records">
          <DataTable
            columns={["Date", "Buyer", "Crop", "Qty", "Rate", "Total Amount", "Received", "Receivable", "Status"]}
            rows={data.sales.map((sale) => [
              dateLabel(sale.saleDate),
              sale.buyerName,
              sale.cropSeason.cropName,
              numberLabel(sale.quantity),
              moneyLabel(sale.unitPrice),
              moneyLabel(sale.amounts.netAmount),
              moneyLabel(sale.received),
              moneyLabel(sale.amounts.receivableAmount),
              <StatusBadge key={sale.id} tone={paymentTone(sale.amounts.paymentStatus)}>
                {sale.amounts.paymentStatus}
              </StatusBadge>
            ])}
          />
          {data.sales.length === 0 ? <p className="mt-4 text-sm text-slate-600">No sales records yet.</p> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
