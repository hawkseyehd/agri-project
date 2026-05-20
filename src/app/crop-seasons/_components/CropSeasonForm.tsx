"use client";

import type { CropSeasonStatus, CropType } from "@prisma/client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type LandBlockOption = {
  id: string;
  name: string;
  farm: {
    name: string;
  };
};

type CropSeasonFormValues = {
  blockId?: string;
  cropType?: CropType;
  cropName?: string;
  variety?: string | null;
  startDate?: Date | string;
  endDate?: Date | string | null;
  harvestTiming?: string | null;
  status?: CropSeasonStatus;
};

type CropSeasonFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  blocks: LandBlockOption[];
  defaultValues?: CropSeasonFormValues;
  submitLabel: string;
};

const statuses: CropSeasonStatus[] = ["PLANNED", "ACTIVE", "HARVESTED", "CLOSED"];
const cropTypes: { value: CropType; label: string }[] = [
  { value: "CROP", label: "Crop" },
  { value: "TREE", label: "Tree" },
  { value: "PLANTAIN", label: "Plantain" },
  { value: "RATOON", label: "Ratoon" }
];

function dateValue(value?: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function fieldError(state: ActionState, key: string) {
  return state.errors?.[key]?.[0];
}

export function CropSeasonForm({ action, blocks, defaultValues, submitLabel }: CropSeasonFormProps) {
  const [state, formAction] = useFormState(action, { ok: false });
  const [cropType, setCropType] = useState<CropType>(defaultValues?.cropType ?? "CROP");
  const isSeasonalCrop = cropType === "CROP";
  const isTree = cropType === "TREE";

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.message ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{state.message}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Land block
          <select
            name="blockId"
            defaultValue={defaultValues?.blockId ?? ""}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="" disabled>
              Select a land block
            </option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.farm.name} / {block.name}
              </option>
            ))}
          </select>
          {fieldError(state, "blockId") ? <span className="block text-xs text-red-600">{fieldError(state, "blockId")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "PLANNED"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Crop type
          <select
            name="cropType"
            value={cropType}
            onChange={(event) => setCropType(event.target.value as CropType)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {cropTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {fieldError(state, "cropType") ? <span className="block text-xs text-red-600">{fieldError(state, "cropType")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Crop name
          <input
            name="cropName"
            defaultValue={defaultValues?.cropName ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          {fieldError(state, "cropName") ? <span className="block text-xs text-red-600">{fieldError(state, "cropName")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Variety
          <input
            name="variety"
            defaultValue={defaultValues?.variety ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          {isSeasonalCrop ? "Sowing date" : "Planting date"}
          <input
            type="date"
            name="startDate"
            defaultValue={dateValue(defaultValues?.startDate)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          {fieldError(state, "startDate") ? <span className="block text-xs text-red-600">{fieldError(state, "startDate")}</span> : null}
        </label>

        {isSeasonalCrop ? (
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Harvesting date
            <input
              type="date"
              name="endDate"
              defaultValue={dateValue(defaultValues?.endDate)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
            {fieldError(state, "endDate") ? <span className="block text-xs text-red-600">{fieldError(state, "endDate")}</span> : null}
          </label>
        ) : (
          <input type="hidden" name="endDate" value="" />
        )}

        {isTree ? (
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Approx harvest time each year
            <input
              name="harvestTiming"
              defaultValue={defaultValues?.harvestTiming ?? ""}
              placeholder="June to July"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
            {fieldError(state, "harvestTiming") ? <span className="block text-xs text-red-600">{fieldError(state, "harvestTiming")}</span> : null}
          </label>
        ) : (
          <input type="hidden" name="harvestTiming" value="" />
        )}
      </div>

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
