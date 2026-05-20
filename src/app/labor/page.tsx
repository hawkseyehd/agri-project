import type { Role } from "@prisma/client";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui/dashboard";
import { archiveWorkerFormAction, createWorkerFormAction } from "@/server/actions/workers.actions";
import { auth } from "@/server/auth/auth";
import { getFarms } from "@/server/queries/farms.queries";
import { getLaborOverview } from "@/server/queries/labor.queries";

type SessionUser = {
  role?: Role;
  assignedFarmIds?: string[];
};

const activityOptions = [
  ["FIELD_LABOUR", "Field labour"],
  ["IRRIGATION", "Irrigation labour"],
  ["PLANTING", "Planting labour"],
  ["HARVESTING", "Harvesting labour"],
  ["LEAF_CUTTING", "Leaf cutting"],
  ["LAND_WORK", "Land work"],
  ["GUD", "Gud"],
  ["DARR", "Darr"],
  ["DARESHI", "Dareshi"],
  ["TRACTOR_WORK", "Tractor work"],
  ["SPRAYING", "Spraying"],
  ["FERTILIZER_APPLICATION", "Fertilizer application"],
  ["WEEDING", "Weeding"],
  ["PRUNING", "Pruning"],
  ["LOADING", "Loading"],
  ["OTHER", "Other"]
];

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

function money(value: number) {
  return `PKR ${value.toLocaleString("en-PK")}`;
}

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function FieldInput({ name, label: inputLabel, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      {inputLabel}
      <input name={name} type={type} placeholder={placeholder} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
    </label>
  );
}

function FarmSelect({ farms }: { farms: Awaited<ReturnType<typeof getFarms>> }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      Farm
      <select name="farmId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
        <option value="">Select farm</option>
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActivitySelect() {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      Work type
      <select name="activityType" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
        {activityOptions.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function IndividualForm({ farms }: { farms: Awaited<ReturnType<typeof getFarms>> }) {
  return (
    <form action={createWorkerFormAction} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="entityKind" value="INDIVIDUAL" />
      <input type="hidden" name="costUnit" value="DAILY_WAGE" />
      <input type="hidden" name="status" value="ACTIVE" />
      <FarmSelect farms={farms} />
      <FieldInput name="name" label="Name" placeholder="Worker name" />
      <FieldInput name="phone" label="Phone" placeholder="Optional" />
      <label className="space-y-1 text-sm font-medium text-slate-700">
        Employment
        <select name="employmentType" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="SALARY">Hired salary employee</option>
          <option value="DAILY_WAGE">Daily wage</option>
          <option value="TEMPORARY">Temporary employee</option>
        </select>
      </label>
      <ActivitySelect />
      <FieldInput name="workerType" label="Label" placeholder="Irrigation labour, planting labour" />
      <FieldInput name="dailyWage" label="Daily wage" type="number" placeholder="1500" />
      <FieldInput name="salaryAmount" label="Monthly salary" type="number" placeholder="Optional" />
      <FieldInput name="startDate" label="Start date" type="date" />
      <FieldInput name="endDate" label="End date" type="date" />
      <div className="md:col-span-2">
        <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
          Add Individual
        </button>
      </div>
    </form>
  );
}

function TeamForm({ farms }: { farms: Awaited<ReturnType<typeof getFarms>> }) {
  return (
    <form action={createWorkerFormAction} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="entityKind" value="TEAM" />
      <input type="hidden" name="employmentType" value="TEMPORARY" />
      <input type="hidden" name="costUnit" value="PER_ACRE" />
      <input type="hidden" name="status" value="ACTIVE" />
      <FarmSelect farms={farms} />
      <FieldInput name="name" label="Team name" placeholder="Leaf cutting team" />
      <ActivitySelect />
      <FieldInput name="workerType" label="Team job" placeholder="Gud, darr, dareshi, leaf cutting" />
      <FieldInput name="perAcreRate" label="Per-acre cost" type="number" placeholder="4500" />
      <FieldInput name="teamSize" label="Team size" type="number" placeholder="Optional" />
      <FieldInput name="startDate" label="Start date" type="date" />
      <FieldInput name="endDate" label="End date" type="date" />
      <div className="md:col-span-2">
        <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
          Add Team
        </button>
      </div>
    </form>
  );
}

export default async function Page() {
  const context = await getAccessContext();

  if (!context) {
    return (
      <AppShell>
        <div className="space-y-5">
          <PageHeader eyebrow="05 Labor" title="Labor Management" description="Sign in to manage labour records, teams, attendance, and history." />
        </div>
      </AppShell>
    );
  }

  const [overview, farms] = await Promise.all([getLaborOverview(context), getFarms(context)]);
  const salaryWorkers = overview.workers.filter((worker) => worker.attendanceRequired).length;
  const reportSelectable = overview.workers.filter((worker) => worker.reportSelectable).length;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="05 Labor"
          title="Labor Management"
          description="Manage farm labour, teams, salary attendance, temporary report selections, wage costs, per-acre jobs, and labour history."
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active registry" value={String(overview.totals.activeWorkers)} helper="Current labour data" />
          <StatCard label="Salary attendance" value={String(salaryWorkers)} helper="Attendance required" />
          <StatCard label="Report selectable" value={String(reportSelectable)} helper="Daily wage, temporary, teams" />
          <StatCard label="History records" value={String(overview.history.length)} helper="Archived labour and teams" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Add Individual Labour">
            <IndividualForm farms={farms} />
          </Panel>
          <Panel title="Add Team Labour">
            <TeamForm farms={farms} />
          </Panel>
        </div>

        <Panel title="Active Labour Data">
          {overview.workers.length > 0 ? (
            <DataTable
              columns={["Name", "Kind", "Employment", "Work", "Cost", "Dates", "Attendance", "Reports", "Action"]}
              rows={overview.workers.map((worker) => [
                worker.name,
                <StatusBadge key={`${worker.id}-kind`} tone={worker.entityKind === "TEAM" ? "blue" : "green"}>
                  {label(worker.entityKind)}
                </StatusBadge>,
                label(worker.employmentType),
                label(worker.activityType),
                worker.costUnit === "PER_ACRE" ? `${money(worker.perAcreRate)} / acre` : `${money(worker.dailyWage)} / day`,
                worker.startDate || worker.endDate ? `${worker.startDate ?? "?"} to ${worker.endDate ?? "?"}` : "No fixed dates",
                worker.attendanceRequired ? <StatusBadge key={`${worker.id}-attendance`}>Yes</StatusBadge> : <StatusBadge key={`${worker.id}-attendance`} tone="slate">No</StatusBadge>,
                worker.reportSelectable ? <StatusBadge key={`${worker.id}-report`} tone="blue">Selectable</StatusBadge> : <StatusBadge key={`${worker.id}-report`} tone="slate">Salary only</StatusBadge>,
                <form key={`${worker.id}-archive`} action={archiveWorkerFormAction.bind(null, worker.id)}>
                  <button type="submit" className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                    Archive
                  </button>
                </form>
              ])}
            />
          ) : (
            <p className="text-sm text-slate-600">No active labour records yet.</p>
          )}
        </Panel>

        <Panel title="Recent Labour History">
          {overview.history.length > 0 ? (
            <DataTable
              columns={["Name", "Farm", "Kind", "Employment", "Work", "Archived", "Reason"]}
              rows={overview.history.map((entry) => [
                entry.name,
                entry.farmName,
                label(entry.entityKind),
                label(entry.employmentType),
                label(entry.activityType),
                entry.archivedAt,
                label(entry.archiveReason)
              ])}
            />
          ) : (
            <p className="text-sm text-slate-600">No labour history records yet.</p>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
