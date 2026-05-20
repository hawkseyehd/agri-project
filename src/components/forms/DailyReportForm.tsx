"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type CropSeasonOption = {
  id: string;
  cropName: string;
  block: {
    name: string;
    farm: {
      name: string;
    };
  };
};

type DailyReportFormProps = {
  action?: (state: ActionState, formData: FormData) => Promise<ActionState>;
  cropSeasons?: CropSeasonOption[];
  laborOptions?: Array<{
    id: string;
    label: string;
    activityType: string;
    costUnit: string;
    dailyWage: number;
    perAcreRate: number;
  }>;
  defaultValues?: {
    cropSeasonId?: string;
    reportDate?: string;
    activities?: string | null;
    labor?: string | null;
    expenses?: string | null;
    inventoryUsage?: string | null;
    irrigation?: string | null;
    inputApplications?: string | null;
    issues?: string | null;
    photos?: string | null;
    tomorrowPlan?: string | null;
    notes?: string | null;
    status?: "DRAFT" | "SUBMITTED";
  };
  submitLabel?: string;
};

type ReportSectionName =
  | "activities"
  | "labor"
  | "expenses"
  | "inventoryUsage"
  | "irrigation"
  | "inputApplications"
  | "issues"
  | "photos"
  | "tomorrowPlan";

const reportSections: Array<{
  name: ReportSectionName;
  label: string;
  placeholder: string;
  rows?: number;
}> = [
  {
    name: "activities",
    label: "Activities",
    placeholder: "Field work, scouting, spraying, land preparation, or crop care completed today."
  },
  {
    name: "labor",
    label: "Labor",
    placeholder: "Worker names/counts, tasks, attendance, wages, advances, paid amount, and balance."
  },
  {
    name: "expenses",
    label: "Expenses",
    placeholder: "Expense category, amount, vendor, payment status, and receipt reference."
  },
  {
    name: "inventoryUsage",
    label: "Inventory usage",
    placeholder: "Items used, quantities, units, purpose, and related block/crop activity."
  },
  {
    name: "irrigation",
    label: "Irrigation",
    placeholder: "Area irrigated, source, hours, water level, and notes."
  },
  {
    name: "inputApplications",
    label: "Input applications",
    placeholder: "Fertilizer, pesticide, seed, diesel, or other input applications."
  },
  {
    name: "issues",
    label: "Issues",
    placeholder: "Pest, disease, weather, machinery, labor, or operational issues."
  },
  {
    name: "photos",
    label: "Photos",
    placeholder: "Uploaded photo paths or references.",
    rows: 2
  },
  {
    name: "tomorrowPlan",
    label: "Tomorrow plan",
    placeholder: "Planned work, labor needs, expected purchases, or follow-up actions."
  }
];

function fieldError(state: ActionState, key: string) {
  return state.errors?.[key]?.[0];
}

async function noopAction() {
  return { ok: true } satisfies ActionState;
}

export function DailyReportForm({ action = noopAction, cropSeasons = [], laborOptions = [], defaultValues, submitLabel = "Save report" }: DailyReportFormProps) {
  const [state, formAction] = useFormState(action, { ok: false });
  const [selectedLaborId, setSelectedLaborId] = useState("");
  const laborTextRef = useRef<HTMLTextAreaElement>(null);

  const selectedLabor = laborOptions.find((option) => option.id === selectedLaborId);

  function appendSelectedLabor() {
    if (!selectedLabor || !laborTextRef.current) {
      return;
    }

    const costText =
      selectedLabor.costUnit === "PER_ACRE"
        ? `per acre rate PKR ${selectedLabor.perAcreRate.toLocaleString("en-PK")}`
        : `daily wage PKR ${selectedLabor.dailyWage.toLocaleString("en-PK")}`;
    const nextLine = `${selectedLabor.label}; ${selectedLabor.activityType.replaceAll("_", " ").toLowerCase()}; ${costText}.`;
    const currentValue = laborTextRef.current.value.trim();
    laborTextRef.current.value = currentValue ? `${currentValue}\n${nextLine}` : nextLine;
  }

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      {state.message ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{state.message}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Crop season
          <select name="cropSeasonId" defaultValue={defaultValues?.cropSeasonId ?? ""} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
            <option value="" disabled>
              Select crop season
            </option>
            {cropSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.cropName} - {season.block.farm.name} / {season.block.name}
              </option>
            ))}
          </select>
          {fieldError(state, "cropSeasonId") ? <span className="block text-xs text-red-600">{fieldError(state, "cropSeasonId")}</span> : null}
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Report date
          <input name="reportDate" type="date" defaultValue={defaultValues?.reportDate ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          {fieldError(state, "reportDate") ? <span className="block text-xs text-red-600">{fieldError(state, "reportDate")}</span> : null}
        </label>
      </div>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        General notes
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Summary notes that do not fit a specific section."
        />
        {fieldError(state, "notes") ? <span className="block text-xs text-red-600">{fieldError(state, "notes")}</span> : null}
      </label>
      {laborOptions.length > 0 ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Add temporary labour or team to report
              <select value={selectedLaborId} onChange={(event) => setSelectedLaborId(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select labour registry item</option>
                {laborOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={appendSelectedLabor} className="self-end rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Add to labor
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {reportSections.map((section) => (
          <label key={section.name} className="block space-y-1 text-sm font-medium text-slate-700">
            {section.label}
            <textarea
              ref={section.name === "labor" ? laborTextRef : undefined}
              name={section.name}
              rows={section.rows ?? 3}
              defaultValue={defaultValues?.[section.name] ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder={section.placeholder}
            />
            {fieldError(state, section.name) ? <span className="block text-xs text-red-600">{fieldError(state, section.name)}</span> : null}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input name="status" type="checkbox" value="SUBMITTED" defaultChecked={defaultValues?.status === "SUBMITTED"} className="h-4 w-4 rounded border-slate-300 text-emerald-700" />
          Mark as submitted
        </label>
        <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
