import type { Role } from "@prisma/client";

import { AiInsightPanel } from "@/components/ai/AiInsightPanel";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { createInventoryItemAction, recordInventoryMovementAction } from "@/server/actions/inventory.actions";
import { auth } from "@/server/auth/auth";
import { getFarms } from "@/server/queries/farms.queries";
import { getInventoryItems, getLowStockItems } from "@/server/queries/inventory.queries";
import { explainInventoryAlerts } from "@/server/services/ai";

type SessionUser = {
  role?: Role;
  assignedFarmIds?: string[];
};

async function getAccessContext() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.role) {
    return undefined;
  }

  return {
    role: user.role,
    assignedFarmIds: user.assignedFarmIds ?? []
  };
}

function formatQuantity(value: unknown, unit: string) {
  return `${Number(value).toLocaleString("en-PK", { maximumFractionDigits: 2 })} ${unit}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}

const itemTypes = [
  "Fertiliser",
  "Pesticide",
  "Medicine",
  "Herbicide",
  "Fungicide",
  "Seed",
  "Tool",
  "Petrol",
  "Diesel",
  "Lubricant",
  "Machinery",
  "Spare Part",
  "Irrigation",
  "Packaging",
  "Animal Feed",
  "Safety Gear",
  "Other"
];

const inventoryUnits = ["BAG", "KG", "GRAM", "LITER", "ML", "PIECE", "BOX", "BOTTLE", "PACKET", "CAN", "DRUM", "METER"];

async function createInventoryItemFromForm(formData: FormData): Promise<void> {
  "use server";

  void (await createInventoryItemAction({ ok: false }, formData));
}

async function recordInventoryMovementFromForm(formData: FormData): Promise<void> {
  "use server";

  void (await recordInventoryMovementAction({ ok: false }, formData));
}

export default async function Page() {
  const context = await getAccessContext();

  if (!context) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="07 Inventory"
          title="Inventory Items"
          description="Track fertilizers, pesticides, fuel, seed, reorder levels, and stock usage history."
        />
        <Panel className="mt-5">
          <p className="text-sm text-slate-600">Sign in to manage inventory.</p>
        </Panel>
      </AppShell>
    );
  }

  const [items, lowStockItems, farms] = await Promise.all([getInventoryItems(context), getLowStockItems(context), getFarms(context)]);
  const aiInventory = await explainInventoryAlerts({
    items: items.map((item) => ({
      name: item.name,
      farmName: item.farm.name,
      quantity: Number(item.quantity),
      lowStockLevel: Number(item.lowStockLevel),
      unit: item.unit
    }))
  });
  const latestMovement = items.flatMap((item) => item.movements.map((movement) => ({ ...movement, item }))).at(0);
  const defaultFarm = farms[0];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="07 Inventory"
          title="Inventory Items"
          description="Track fertilizers, pesticides, fuel, seed, reorder levels, and stock usage history."
        />
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Stock items" value={String(items.length)} helper="Across accessible farms" />
          <StatCard label="Low stock" value={String(lowStockItems.length)} helper="At or below reorder level" />
          <StatCard label="Farms" value={String(farms.length)} helper="Available inventory scopes" />
          <StatCard label="Last movement" value={latestMovement ? formatDate(latestMovement.createdAt) : "-"} helper={latestMovement?.item.name ?? "No movement recorded"} />
        </div>

        <Panel title="AI Inventory Alert Intelligence">
          <AiInsightPanel
            title="Reorder suggestions"
            summary={aiInventory.overallRisk}
            items={aiInventory.alerts.map((alert) => `${alert.message} ${alert.suggestion}`).slice(0, 5)}
            footer="Suggestions are operational drafts; confirm actual stock, pending purchases, and planned usage."
          />
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Panel title="Inventory Items">
            {items.length > 0 ? (
              <DataTable
                columns={["Item", "Type", "Farm", "Unit", "Current Stock", "Low Stock Level", "Status"]}
                rows={items.map((item) => {
                  const lowStock = Number(item.quantity) <= Number(item.lowStockLevel);

                  return [
                    item.name,
                    item.itemType,
                    item.farm.name,
                    item.unit,
                    formatQuantity(item.quantity, item.unit),
                    formatQuantity(item.lowStockLevel, item.unit),
                    <StatusBadge key={`${item.id}-status`} tone={lowStock ? "red" : "green"}>
                      {lowStock ? "Low stock" : "In stock"}
                    </StatusBadge>
                  ];
                })}
              />
            ) : (
              <p className="text-sm text-slate-500">No inventory items have been recorded yet.</p>
            )}
          </Panel>

          <Panel title="Add Item">
            {defaultFarm ? (
              <form action={createInventoryItemFromForm} className="space-y-4">
                <input type="hidden" name="farmId" value={defaultFarm.id} />
                <label className="block space-y-1 text-sm font-medium text-slate-700">
                  Item name
                  <input name="name" placeholder="e.g. Urea, spray pump, petrol" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block space-y-1 text-sm font-medium text-slate-700">
                  Item type
                  <input
                    name="itemType"
                    list="inventory-item-types"
                    placeholder="Search or select type"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                  <datalist id="inventory-item-types">
                    {itemTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block space-y-1 text-sm font-medium text-slate-700">
                    Unit
                    <input name="unit" list="inventory-units" placeholder="e.g. BAG, LITER" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                    <datalist id="inventory-units">
                      {inventoryUnits.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                  </label>
                  <label className="block space-y-1 text-sm font-medium text-slate-700">
                    Quantity
                    <input name="quantity" type="number" min="0" step="0.01" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="block space-y-1 text-sm font-medium text-slate-700">
                    Low stock optional
                    <input name="lowStockLevel" type="number" min="0" step="0.01" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                  Save item
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Create a farm before adding inventory items.</p>
            )}
          </Panel>
        </div>

        <Panel title="Record Movement">
          <form action={recordInventoryMovementFromForm} className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr_auto]">
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              Item
              <select name="itemId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.farm.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              Type
              <select name="type" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
                <option value="PURCHASE">Purchase</option>
                <option value="USAGE">Usage</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="WASTAGE">Wastage</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              Quantity
              <input name="quantity" type="number" min="0.01" step="0.01" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              Notes
              <input name="notes" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <div className="flex items-end">
              <button type="submit" className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
                Record
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
