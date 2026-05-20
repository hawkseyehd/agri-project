import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getFarmById, type AccessContext } from "@/server/queries/farms.queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function numberLabel(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

export default async function FarmDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <main className="p-6">
          <PageHeader eyebrow="Farm Detail" title="Farm" description="Sign in to view farm details." />
        </main>
      </AppShell>
    );
  }

  const farm = await getFarmById(id, access);

  if (!farm) {
    notFound();
  }

  const totalBlockArea = farm.blocks.reduce((total, block) => total + Number(block.areaAcres ?? 0), 0);
  const activeSeasons = farm.blocks.reduce((total, block) => total + block.seasons.filter((season) => season.status === "ACTIVE").length, 0);
  const expenseTotal = farm.expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const canManageFarms = access.role === "OWNER" || access.role === "ADMIN";
  const farmTypeLabel = farm.type === "OWNER" ? "Owner" : farm.type === "CONTRACTOR" ? "Contractor" : "Lease";

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Farm Detail"
          title={farm.name}
          description={farm.address || farm.location || "No address set."}
          action={
            canManageFarms ? (
              <Link href={`/farms/${farm.id}/edit`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Edit farm
              </Link>
            ) : undefined
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Farm area" value={`${numberLabel(farm.area)} Acres`} helper={farmTypeLabel} />
          <StatCard label="Land blocks" value={String(farm.blocks.length)} helper={`${numberLabel(totalBlockArea)} mapped acres`} />
          <StatCard label="Active seasons" value={String(activeSeasons)} helper="Current crop cycles" />
          <StatCard label="Expenses" value={`PKR ${numberLabel(expenseTotal)}`} helper="Recorded farm expense" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Panel title="Land Blocks">
            <DataTable
              columns={["Block", "Area", "Crop Seasons", "Status", "Action"]}
              rows={farm.blocks.map((block) => [
                <span key={block.id} id={`block-${block.id}`} className="font-medium text-slate-900">
                  {block.name}
                </span>,
                block.areaAcres ? `${numberLabel(block.areaAcres)} Acres` : "Not set",
                String(block.seasons.length),
                block.seasons.some((season) => season.status === "ACTIVE") ? <StatusBadge key="active">Active</StatusBadge> : <StatusBadge key="idle" tone="slate">Idle</StatusBadge>,
                <Link key={`${block.id}-edit`} href={`/land-blocks/${block.id}/edit`} className="font-medium text-emerald-800 hover:underline">
                  Edit
                </Link>
              ])}
            />
          </Panel>

          <Panel title="Assigned Managers">
            <div className="space-y-3">
              {farm.managers.map((assignment) => (
                <div key={assignment.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="font-semibold text-slate-900">{assignment.manager.name}</div>
                  <div className="text-slate-500">{assignment.manager.email}</div>
                </div>
              ))}
              {farm.managers.length === 0 ? <p className="text-sm text-slate-600">No managers assigned yet.</p> : null}
            </div>
          </Panel>
        </div>
      </main>
    </AppShell>
  );
}
