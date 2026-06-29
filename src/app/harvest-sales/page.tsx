import { HarvestEntryForm } from "@/app/harvest-sales/HarvestEntryForm";
import { AppShell } from "@/components/layout/AppShell";
import { ArchiveActionButton } from "@/components/ui/ArchiveActionButton";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { archiveHarvestAction } from "@/server/actions/harvests.actions";
import { archiveSaleAction } from "@/server/actions/sales.actions";
import { auth } from "@/server/auth/auth";
import { canUsePagePermission } from "@/server/auth/permissions";
import { getHarvestSalesPageData, type HarvestSalesAccessContext } from "@/server/queries/harvest-sales/harvest-sales.queries";

type PageProps = {
  searchParams?: Promise<{
    cropSeasonId?: string;
  }>;
};

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

function todayValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export default async function Page({ searchParams }: PageProps) {
  const requestedCropSeasonId = (await searchParams)?.cropSeasonId;
  const session = await auth();
  const access = getAccessContext(session?.user);

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
  const selectedSeason = data.cropSeasons.find((season) => season.id === requestedCropSeasonId);
  const canArchive = Boolean(session?.user && canUsePagePermission(session.user.role, session.user.pagePermissions ?? [], "HARVEST_SALES", "delete"));

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
        <Panel title="Record Harvest">
          <HarvestEntryForm
            cropSeasons={data.cropSeasons.map((season) => ({
              value: season.id,
              label: `${season.cropName} - ${season.block.farm.name} / ${season.block.name}`,
              expectedHarvestDate: season.endDate?.toISOString().slice(0, 10) ?? null
            }))}
            selectedCropSeasonId={selectedSeason?.id}
            defaultHarvestDate={selectedSeason ? todayValue() : ""}
          />
        </Panel>
        <Panel title="Harvest Records">
          <DataTable
            columns={["Date", "Crop", "Farm / Block", "Qty Harvested", "Unit", "Notes", "Actions"]}
            rows={data.harvests.map((harvest) => [
              dateLabel(harvest.harvestDate),
              harvest.cropSeason.cropName,
              `${harvest.cropSeason.block.farm.name} / ${harvest.cropSeason.block.name}`,
              numberLabel(harvest.quantity),
              harvest.unit,
              harvest.notes ?? "None",
              canArchive ? (
                <ArchiveActionButton
                  key={`${harvest.id}-archive`}
                  action={archiveHarvestAction.bind(null, harvest.id)}
                  description="This hides the harvest from active records and totals. The stored record and linked sales remain unchanged."
                />
              ) : null
            ])}
          />
          {data.harvests.length === 0 ? <p className="mt-4 text-sm text-slate-600">No harvest records yet.</p> : null}
        </Panel>
        <Panel title="Sales Records">
          <DataTable
            columns={["Date", "Buyer", "Crop", "Qty", "Rate", "Total Amount", "Received", "Receivable", "Status", "Actions"]}
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
              </StatusBadge>,
              canArchive ? (
                <ArchiveActionButton
                  key={`${sale.id}-archive`}
                  action={archiveSaleAction.bind(null, sale.id)}
                  description="This hides the sale from active records and financial totals. The stored record remains available in the database."
                />
              ) : null
            ])}
          />
          {data.sales.length === 0 ? <p className="mt-4 text-sm text-slate-600">No sales records yet.</p> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
