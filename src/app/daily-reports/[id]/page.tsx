import type { Role } from "@prisma/client";
import { notFound } from "next/navigation";

import { DailyReportForm } from "@/components/forms/DailyReportForm";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatusBadge } from "@/components/ui/dashboard";
import { updateDailyReportAction } from "@/server/actions/daily-reports.actions";
import { auth } from "@/server/auth/auth";
import { getAccessibleCropSeasonsForReports, getDailyReportById } from "@/server/queries/daily-reports.queries";

type SessionUser = {
  role?: Role;
  assignedFarmIds?: string[];
};

type PageProps = {
  params: {
    id: string;
  };
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

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}

const noteSectionMap = {
  Activities: "activities",
  Labor: "labor",
  Expenses: "expenses",
  "Inventory usage": "inventoryUsage",
  Irrigation: "irrigation",
  "Input applications": "inputApplications",
  Issues: "issues",
  Photos: "photos",
  "Tomorrow plan": "tomorrowPlan",
  "General notes": "notes"
} as const;

function parseReportNotes(notes: string | null) {
  if (!notes) {
    return {};
  }

  const defaults: Record<string, string> = {};
  const sections = notes.split(/\n\n(?=[A-Za-z ]+:\n)/);

  for (const section of sections) {
    const match = section.match(/^([A-Za-z ]+):\n([\s\S]*)$/);

    if (!match) {
      defaults.notes = [defaults.notes, section].filter(Boolean).join("\n\n");
      continue;
    }

    const key = noteSectionMap[match[1] as keyof typeof noteSectionMap];

    if (key) {
      defaults[key] = match[2];
    }
  }

  return defaults;
}

export default async function Page({ params }: PageProps) {
  const context = await getAccessContext();

  if (!context) {
    return (
      <AppShell>
        <PageHeader eyebrow="Daily Reports" title="Daily Report" description="View and update a daily farm report." />
        <Panel className="mt-5">
          <p className="text-sm text-slate-600">Sign in to view this report.</p>
        </Panel>
      </AppShell>
    );
  }

  const [report, cropSeasons] = await Promise.all([
    getDailyReportById(params.id, context),
    getAccessibleCropSeasonsForReports(context)
  ]);

  if (!report) {
    notFound();
  }

  const action = updateDailyReportAction.bind(null, report.id);
  const reportDefaults = parseReportNotes(report.notes);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          eyebrow="Daily Report Detail"
          title={`Daily Report - ${formatDate(report.reportDate)}`}
          description={`${report.cropSeason.cropName} at ${report.cropSeason.block.farm.name} / ${report.cropSeason.block.name}`}
          action={report.submittedAt ? <StatusBadge>Submitted</StatusBadge> : <StatusBadge tone="amber">Draft</StatusBadge>}
        />
        <Panel title="Report Notes">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{report.notes || "No report details recorded yet."}</pre>
        </Panel>
        <Panel title="Edit Report">
          <DailyReportForm
            action={action}
            cropSeasons={cropSeasons}
            defaultValues={{
              cropSeasonId: report.cropSeasonId,
              reportDate: toDateInput(report.reportDate),
              ...reportDefaults,
              status: report.submittedAt ? "SUBMITTED" : "DRAFT"
            }}
            submitLabel="Update report"
          />
        </Panel>
      </div>
    </AppShell>
  );
}
