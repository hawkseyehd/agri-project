import { BellRing } from "lucide-react";

import { AiInsightPanel } from "@/components/ai/AiInsightPanel";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getDashboardPageData, type DashboardAccessContext } from "@/server/queries/dashboard/dashboard.queries";
import { draftNotifications } from "@/server/services/ai";

function getAccessContext(sessionUser: unknown): DashboardAccessContext | null {
  const user = sessionUser as Partial<DashboardAccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function isToday(value: Date) {
  const now = new Date();
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate();
}

export default async function Page() {
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Notifications"
          title="Alerts and Reminders"
          description="Sign in to review daily report reminders, low-stock warnings, payment reminders, and operational notices."
        />
      </AppShell>
    );
  }

  const data = await getDashboardPageData(access);
  const reportsToday = new Set(data.recentReports.filter((report) => isToday(report.reportDate)).map((report) => report.cropSeason.id));
  const notificationDrafts = await draftNotifications({
    lowStockItems: data.lowStockItems.map((item) => ({
      name: item.name,
      farmName: item.farm.name,
      quantity: Number(item.quantity),
      lowStockLevel: Number(item.lowStockLevel),
      unit: item.unit
    })),
    missingReports: data.activeCropSeasons
      .filter((season) => !reportsToday.has(season.id))
      .map((season) => ({
        farmName: season.block.farm.name,
        blockName: season.block.name,
        cropName: season.cropName
      })),
    receivableAmount: data.summary.receivable,
    operationalWarnings:
      data.summary.dailyReports.pending > 0
        ? [`${data.summary.dailyReports.pending} daily report is still pending for active crop seasons.`]
        : []
  });

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Notifications"
          title="Alerts and Reminders"
          description="Review daily report reminders, low-stock warnings, irrigation alerts, payment reminders, and weather notices."
        />
        <Panel title="AI Notification Generator">
          <AiInsightPanel
            title="Draft queue"
            summary={`${notificationDrafts.drafts.length} draft reminders generated from current operational signals.`}
            items={notificationDrafts.drafts.map((draft) => `${draft.type}: ${draft.message}`).slice(0, 6)}
            footer={notificationDrafts.reviewReminder}
          />
        </Panel>
        <Panel title="Notification Queue">
          <DataTable
            columns={["Type", "Message", "Farm", "Due", "Status"]}
            rows={notificationDrafts.drafts.map((draft) => [
              draft.type,
              draft.message,
              draft.type === "Inventory" ? "Inventory scope" : "Accessible farms",
              draft.priority,
              <StatusBadge key={`${draft.type}-${draft.message}`} tone={draft.priority === "Urgent" ? "red" : draft.priority === "Today" ? "amber" : "blue"}>
                Draft
              </StatusBadge>
            ])}
          />
          {notificationDrafts.drafts.length === 0 ? <p className="mt-4 text-sm text-slate-600">No notification drafts are needed from current signals.</p> : null}
        </Panel>
        <Panel title="Reminder Health">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <BellRing className="h-5 w-5 text-emerald-700" />
            Notification preferences are configured in Settings.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
