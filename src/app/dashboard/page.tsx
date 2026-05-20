import Link from "next/link";
import { Boxes, ClipboardList, TrendingUp, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";

import { AiInsightPanel } from "@/components/ai/AiInsightPanel";
import { AppShell } from "@/components/layout/AppShell";
import { ColorKey, DataTable, MiniBars, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import {
  AssignManagerForm,
  CreateManagerForm,
  UserPermissionsForms
} from "@/app/settings/_components/SettingsForms";
import { auth, getSessionUser } from "@/server/auth/auth";
import { canAccessPackageUsers, getPackageUserLimit } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { getDashboardPageData, type DashboardAccessContext } from "@/server/queries/dashboard/dashboard.queries";
import { getSettingsDashboardData } from "@/server/queries/settings/settings.queries";
import { summarizeDashboardStatus } from "@/server/services/ai";

function getAccessContext(sessionUser: unknown): DashboardAccessContext | null {
  const user = sessionUser as Partial<DashboardAccessContext> | undefined;
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

function expenseValues(breakdown: Record<string, number>) {
  const values = Object.values(breakdown);
  return values.length > 0 ? values : [0];
}

export default async function Page({ searchParams }: { searchParams?: { farmId?: string } }) {
  const session = await auth();
  const access = getAccessContext(session?.user);
  const farmId = typeof searchParams?.farmId === "string" && searchParams.farmId ? searchParams.farmId : undefined;

  if (!access) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="01 Dashboard"
          title="Farm Operations Overview"
          description="Sign in to review live summaries, reports, alerts, labor, and field activity."
        />
      </AppShell>
    );
  }

  if (access.role === "SUPER_ADMIN" && !farmId) {
    redirect("/super-admin");
  }

  if (session?.user?.id && access.role === "LAND_OWNER" && !session.user.companyName) {
    redirect("/setup-farm");
  }

  const scopedAccess = {
    ...access,
    farmId
  };
  const data = await getDashboardPageData(scopedAccess);
  const summary = data.summary;
  const aiSummary = await summarizeDashboardStatus(summary);
  const user = getSessionUser(session);
  const canManageDashboardUsers = user ? canAccessPackageUsers(user.role, user.packageTier) : false;
  const dashboardUserData = canManageDashboardUsers && user ? await getSettingsDashboardData(user) : { users: [], managers: [], farms: [] };
  const packageUserLimit = user ? getPackageUserLimit(user.packageTier) : 0;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="01 Dashboard"
          title="Farm Operations Overview"
          description="Live snapshot of seasons, expenses, revenue, profit estimates, daily reports, and inventory alerts."
          action={
            <Link href="/daily-reports" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Submit End-of-Day Report
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Active crop seasons" value={numberLabel(summary.activeCropSeasons)} helper="Currently in progress" />
          <StatCard
            label="Today's reports"
            value={`${summary.dailyReports.submitted}/${summary.dailyReports.due}`}
            helper={`${summary.dailyReports.pending} pending`}
          />
          <StatCard label="Season expenses" value={moneyLabel(summary.seasonExpenses)} helper="From expense records" />
          <StatCard label="Booked revenue" value={moneyLabel(summary.expectedRevenue)} helper={`${moneyLabel(summary.receivable)} receivable`} />
          <StatCard label="Profit estimate" value={moneyLabel(summary.profitEstimate)} helper="Revenue minus expenses" />
        </div>

        <Panel title="AI Operational Summary">
          <AiInsightPanel title="Suggested follow-ups" summary={aiSummary.summary} items={[...aiSummary.risks, ...aiSummary.nextActions].slice(0, 6)} />
        </Panel>

        {canManageDashboardUsers ? (
          <div id="user-management" className="grid gap-4 lg:grid-cols-2">
            <Panel title="User Management" className="lg:col-span-2">
              <DataTable
                columns={["Name", "Email", "Role", "Assigned Farms"]}
                rows={dashboardUserData.users.map((settingsUser) => [
                  settingsUser.name,
                  settingsUser.email,
                  <StatusBadge key={`${settingsUser.id}-role`} tone={settingsUser.role === "MANAGER" ? "blue" : "green"}>
                    {settingsUser.role}
                  </StatusBadge>,
                  settingsUser.assignments.length > 0 ? settingsUser.assignments.map((assignment) => assignment.farm.name).join(", ") : "Unassigned"
                ])}
              />
              {dashboardUserData.users.length === 0 ? <p className="mt-4 text-sm text-slate-600">No users found.</p> : null}
            </Panel>
            <Panel title={`Create User${packageUserLimit > 0 ? ` (${dashboardUserData.users.length}/${packageUserLimit})` : ""}`}>
              <CreateManagerForm farms={dashboardUserData.farms} />
            </Panel>
            <Panel title="Assign User To Farms">
              <AssignManagerForm farms={dashboardUserData.farms} managers={dashboardUserData.managers} />
            </Panel>
            <Panel title="Page Permissions" className="lg:col-span-2">
              <UserPermissionsForms managers={dashboardUserData.managers} />
            </Panel>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
          <Panel title="Expense Breakdown">
            <MiniBars values={expenseValues(data.expenseBreakdown)} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(data.expenseBreakdown).slice(0, 6).map(([category, amount]) => (
                <ColorKey key={category} label={`${category}: ${moneyLabel(amount)}`} color="bg-emerald-600" />
              ))}
              {Object.keys(data.expenseBreakdown).length === 0 ? <p className="text-sm text-slate-600">No expenses recorded yet.</p> : null}
            </div>
          </Panel>
          <Panel title="Daily Report Status">
            <div className="space-y-3 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-slate-600">Submitted today</span>
                <StatusBadge>{summary.dailyReports.submitted}</StatusBadge>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-600">Expected today</span>
                <StatusBadge tone="blue">{summary.dailyReports.due}</StatusBadge>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-600">Pending</span>
                <StatusBadge tone={summary.dailyReports.pending > 0 ? "amber" : "green"}>{summary.dailyReports.pending}</StatusBadge>
              </p>
            </div>
          </Panel>
          <Panel title="Operational Signals">
            <div className="space-y-4 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-600" /> {summary.lowStockCount} low-stock inventory items
              </p>
              <p className="flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-emerald-700" /> {moneyLabel(summary.wagesToday)} wages recorded today
              </p>
              <p className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" /> {moneyLabel(summary.receivable)} pending collection
              </p>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Active Crop Blocks" className="xl:col-span-2">
            <DataTable
              columns={["Farm", "Block", "Crop", "Started", "Status"]}
              rows={data.activeCropSeasons.map((season) => [
                season.block.farm.name,
                season.block.name,
                season.cropName,
                dateLabel(season.startDate),
                <StatusBadge key={season.id}>{season.status}</StatusBadge>
              ])}
            />
            {data.activeCropSeasons.length === 0 ? <p className="mt-4 text-sm text-slate-600">No active crop seasons found.</p> : null}
          </Panel>
          <Panel title="Inventory Alerts">
            <div className="space-y-3 text-sm">
              {data.lowStockItems.map((item) => (
                <p key={item.id} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="block text-xs text-slate-500">{item.farm.name}</span>
                  </span>
                  <StatusBadge tone="red">
                    {numberLabel(item.quantity)} / {numberLabel(item.lowStockLevel)} {item.unit}
                  </StatusBadge>
                </p>
              ))}
              {data.lowStockItems.length === 0 ? <p className="text-sm text-slate-600">No low-stock alerts.</p> : null}
            </div>
          </Panel>
        </div>

        <Panel title="Recent Daily Reports">
          <DataTable
            columns={["Date", "Farm / Block", "Crop", "Submitted", "Notes"]}
            rows={data.recentReports.map((report) => [
              dateLabel(report.reportDate),
              `${report.cropSeason.block.farm.name} / ${report.cropSeason.block.name}`,
              report.cropSeason.cropName,
              report.submittedAt ? <StatusBadge key={report.id}>Submitted</StatusBadge> : <StatusBadge key={report.id} tone="amber">Draft</StatusBadge>,
              report.notes ?? "None"
            ])}
          />
          {data.recentReports.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <ClipboardList className="h-4 w-4" /> No daily reports have been recorded yet.
            </p>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
