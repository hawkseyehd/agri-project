import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui/dashboard";

export default function Page() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Activity Logs"
          title="System Activity"
          description="Audit recent manager actions, operational updates, uploads, report submissions, and settings changes."
        />
        <Panel title="Recent Activity">
          <DataTable
            columns={["Time", "User", "Module", "Action", "Status"]}
            rows={[
              ["26 Apr 2026, 6:40 PM", "Usman Khan", "Daily Reports", "Submitted report for Block A", <StatusBadge key="done">Recorded</StatusBadge>],
              ["26 Apr 2026, 4:15 PM", "Ali Raza", "Expenses", "Approved fertilizer expense", <StatusBadge key="approved">Approved</StatusBadge>],
              ["25 Apr 2026, 9:00 AM", "Noman Ahmed", "Inventory", "Updated diesel stock", <StatusBadge key="recorded" tone="blue">Synced</StatusBadge>]
            ]}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
