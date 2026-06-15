"use client";

import { useFormState, useFormStatus } from "react-dom";

import { BoundaryDrawMap } from "@/components/maps/BoundaryDrawMap";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type FarmOption = {
  id: string;
  name: string;
};

type LandBlockFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  farms: FarmOption[];
  defaultValues?: {
    farmId?: string;
    name?: string;
    areaAcres?: unknown;
    boundaryGeoJson?: string | null;
  };
  submitLabel: string;
};

function fieldError(state: ActionState, key: string) {
  return state.errors?.[key]?.[0];
}

function decimalValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export function LandBlockForm({ action, farms, defaultValues, submitLabel }: LandBlockFormProps) {
  const [state, formAction] = useFormState(action, { ok: false });

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.message ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{state.message}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Farm
          <select name="farmId" defaultValue={defaultValues?.farmId ?? ""} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
            <option value="" disabled>
              Select a farm
            </option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
          {fieldError(state, "farmId") ? <span className="block text-xs text-red-600">{fieldError(state, "farmId")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Block name
          <input name="name" defaultValue={defaultValues?.name ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          {fieldError(state, "name") ? <span className="block text-xs text-red-600">{fieldError(state, "name")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Area acres
          <input
            type="number"
            id="areaAcres"
            step="0.01"
            min="0"
            name="areaAcres"
            defaultValue={decimalValue(defaultValues?.areaAcres)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {fieldError(state, "areaAcres") ? <span className="block text-xs text-red-600">{fieldError(state, "areaAcres")}</span> : null}
        </label>
      </div>

      <BoundaryDrawMap fieldName="boundaryGeoJson" areaFieldId="areaAcres" defaultBoundary={defaultValues?.boundaryGeoJson} />

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}
