"use client";

import { Sparkles } from "lucide-react";
import { useFormState } from "react-dom";

import { structureDailyReportNotesAction, type DailyReportAiActionState } from "@/server/actions/ai.actions";

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

const suggestionLabels: Array<[keyof NonNullable<DailyReportAiActionState["suggestions"]>, string]> = [
  ["activities", "Activities"],
  ["labor", "Labor"],
  ["expenses", "Expenses"],
  ["inventoryUsage", "Inventory usage"],
  ["irrigation", "Irrigation"],
  ["inputApplications", "Input applications"],
  ["issues", "Issues"],
  ["tomorrowPlan", "Tomorrow plan"],
  ["notes", "General notes"]
];

export function DailyReportAssistant({ cropSeasons }: { cropSeasons: CropSeasonOption[] }) {
  const [state, formAction] = useFormState(structureDailyReportNotesAction, { ok: false });

  return (
    <div className="space-y-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 text-emerald-700" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Daily Report Assistant</h3>
          <p className="text-xs text-slate-600">Turn rough manager notes into structured draft sections for review.</p>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Crop season
          <select name="cropSeasonId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">No crop season selected</option>
            {cropSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.cropName} - {season.block.farm.name} / {season.block.name}
              </option>
            ))}
          </select>
          {state.errors?.cropSeasonId?.[0] ? <span className="block text-xs text-red-600">{state.errors.cropSeasonId[0]}</span> : null}
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Rough notes
          <textarea
            name="notes"
            rows={5}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Example: Block A wheat irrigated 3 acres, 4 workers weeded, used 2 bags urea, diesel 7000 paid, pump belt issue."
          />
          {state.errors?.notes?.[0] ? <span className="block text-xs text-red-600">{state.errors.notes[0]}</span> : null}
        </label>
        <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
          <Sparkles className="h-4 w-4" />
          Generate draft
        </button>
      </form>
      {state.message ? (
        <p className={`rounded-md px-3 py-2 text-sm ${state.ok ? "bg-white text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p>
      ) : null}
      {state.suggestions ? (
        <div className="grid gap-3 md:grid-cols-2">
          {suggestionLabels.map(([key, label]) => (
            <div key={key} className="border-l-2 border-emerald-300 bg-white px-3 py-2">
              <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-1 text-sm text-slate-700">{state.suggestions?.[key]}</p>
            </div>
          ))}
        </div>
      ) : null}
      {state.reviewReminder ? <p className="text-xs text-slate-500">{state.reviewReminder}</p> : null}
    </div>
  );
}
