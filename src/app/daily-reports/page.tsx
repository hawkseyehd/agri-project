import type { Role } from "@prisma/client";
import Link from "next/link";

import { DailyReportAssistant } from "@/components/ai/DailyReportAssistant";
import { DailyReportForm } from "@/components/forms/DailyReportForm";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, PrimaryButton, StatusBadge } from "@/components/ui/dashboard";
import { createDailyReportAction } from "@/server/actions/daily-reports.actions";
import { auth } from "@/server/auth/auth";
import { getAccessibleCropSeasonsForReports, getDailyReports } from "@/server/queries/daily-reports.queries";
import { getReportSelectableLabor } from "@/server/queries/labor.queries";

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}

export default async function Page() {
  const context = await getAccessContext();

  if (!context) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="04 Daily Reports"
          title="Daily Farm Reports"
          description="Capture end-of-day crop activity, labor, expenses, inventory usage, irrigation, inputs, and machinery notes."
        />
        <Panel className="mt-5">
          <p className="text-sm text-slate-600">Sign in to manage daily reports.</p>
        </Panel>
      </AppShell>
    );
  }

  const [reports, cropSeasons, laborOptions] = await Promise.all([getDailyReports(context), getAccessibleCropSeasonsForReports(context), getReportSelectableLabor(context)]);

  const reportRows = reports.map((report) => [
    <Link className="font-semibold text-emerald-700" href={`/daily-reports/${report.id}`} key={`${report.id}-date`}>
      {formatDate(report.reportDate)}
    </Link>,
    report.cropSeason.block.farm.name,
    report.cropSeason.block.name,
    report.cropSeason.cropName,
    report.manager.name,
    report.submittedAt ? <StatusBadge key={`${report.id}-status`}>Submitted</StatusBadge> : <StatusBadge key={`${report.id}-status`} tone="amber">Draft</StatusBadge>
  ]);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="04 Daily Reports"
          title="Daily Farm Reports"
          description="Capture end-of-day crop activity, labor, expenses, inventory usage, irrigation, inputs, and machinery notes."
          action={<PrimaryButton>New Daily Report</PrimaryButton>}
        />

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.6fr]">
          <Panel title="Report History">
            {reportRows.length > 0 ? (
              <DataTable columns={["Date", "Farm", "Block", "Crop", "Manager", "Status"]} rows={reportRows} />
            ) : (
              <p className="text-sm text-slate-500">No daily reports have been recorded yet.</p>
            )}
          </Panel>

          <div className="space-y-4">
            <Panel title="AI Draft Helper">
              <DailyReportAssistant cropSeasons={cropSeasons} />
            </Panel>
            <Panel title="New Daily Report">
              <DailyReportForm action={createDailyReportAction} cropSeasons={cropSeasons} laborOptions={laborOptions} />
            </Panel>
          </div>
        </div>

        <Panel title="Submission Status">
          <div className="flex flex-wrap gap-3 text-sm">
            <StatusBadge>{reports.filter((report) => report.submittedAt).length} Submitted</StatusBadge>
            <StatusBadge tone="amber">{reports.filter((report) => !report.submittedAt).length} Draft</StatusBadge>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
