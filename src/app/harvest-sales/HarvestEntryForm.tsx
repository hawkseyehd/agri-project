"use client";

import { AlertTriangle, Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { createHarvestAction, type HarvestActionState } from "@/server/actions/harvests.actions";

type CropSeasonOption = {
  value: string;
  label: string;
  expectedHarvestDate: string | null;
};

const initialState: HarvestActionState = {
  ok: false
};

function fieldError(state: HarvestActionState, key: string) {
  return state.errors?.[key]?.[0];
}

function SubmitButton({ blocked, includesSale }: { blocked: boolean; includesSale: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || blocked}
      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
    >
      {pending ? "Saving..." : includesSale ? "Save Harvest & Sale" : "Save Harvest"}
    </button>
  );
}

export function HarvestEntryForm({
  cropSeasons,
  defaultHarvestDate = "",
  selectedCropSeasonId = ""
}: {
  cropSeasons: CropSeasonOption[];
  defaultHarvestDate?: string;
  selectedCropSeasonId?: string;
}) {
  const [includesSale, setIncludesSale] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState(selectedCropSeasonId);
  const [harvestDate, setHarvestDate] = useState(defaultHarvestDate);
  const [allowsEarlyHarvest, setAllowsEarlyHarvest] = useState(false);
  const [state, formAction] = useFormState(createHarvestAction, initialState);
  const expectedHarvestDate = cropSeasons.find((season) => season.value === selectedSeasonId)?.expectedHarvestDate ?? null;
  const isEarlyHarvest = Boolean(expectedHarvestDate && harvestDate && harvestDate < expectedHarvestDate);

  function selectSeason(value: string) {
    setSelectedSeasonId(value);
    setAllowsEarlyHarvest(false);
  }

  function selectHarvestDate(value: string) {
    setHarvestDate(value);
    setAllowsEarlyHarvest(false);
  }

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="includeSale" value={includesSale ? "true" : "false"} />
      <input type="hidden" name="allowEarlyHarvest" value={allowsEarlyHarvest ? "true" : "false"} />

      {state.message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm md:col-span-2 ${
            state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Crop season
        <select
          name="cropSeasonId"
          required
          value={selectedSeasonId}
          onChange={(event) => selectSeason(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select crop season</option>
          {cropSeasons.map((season) => (
            <option key={season.value} value={season.value}>
              {season.label}
            </option>
          ))}
        </select>
        {fieldError(state, "cropSeasonId") ? <span className="text-xs text-red-600">{fieldError(state, "cropSeasonId")}</span> : null}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Harvest date
        <input
          name="harvestDate"
          required
          type="date"
          value={harvestDate}
          onChange={(event) => selectHarvestDate(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {fieldError(state, "harvestDate") ? <span className="text-xs text-red-600">{fieldError(state, "harvestDate")}</span> : null}
      </label>

      {isEarlyHarvest ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950 md:col-span-2" aria-live="polite">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="font-semibold">This harvest is earlier than the expected harvest date.</p>
              <p className="mt-1 text-xs text-amber-800">Expected harvest: {expectedHarvestDate}</p>
              {!allowsEarlyHarvest ? (
                <button
                  type="button"
                  onClick={() => setAllowsEarlyHarvest(true)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <Check className="h-3.5 w-3.5" />
                  Continue with early harvest
                </button>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Check className="h-3.5 w-3.5" /> Early harvest confirmed
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Quantity harvested
        <input name="quantity" required inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "quantity") ? <span className="text-xs text-red-600">{fieldError(state, "quantity")}</span> : null}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Unit
        <input name="unit" required placeholder="e.g. Maund" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "unit") ? <span className="text-xs text-red-600">{fieldError(state, "unit")}</span> : null}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
        Notes
        <textarea name="notes" className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>

      {!includesSale ? (
        <button
          type="button"
          onClick={() => setIncludesSale(true)}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 md:col-span-2"
        >
          <Plus className="h-4 w-4" />
          Add sales data
        </button>
      ) : (
        <fieldset className="grid gap-3 border-t border-slate-200 pt-4 md:col-span-2 md:grid-cols-2">
          <div className="flex items-center justify-between md:col-span-2">
            <legend className="text-sm font-bold text-slate-900">Sales data</legend>
            <button
              type="button"
              onClick={() => setIncludesSale(false)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          </div>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Buyer name
            <input name="buyerName" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {fieldError(state, "buyerName") ? <span className="text-xs text-red-600">{fieldError(state, "buyerName")}</span> : null}
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Sale date
            <input name="saleDate" required type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {fieldError(state, "saleDate") ? <span className="text-xs text-red-600">{fieldError(state, "saleDate")}</span> : null}
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Quantity sold
            <input name="saleQuantity" required inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {fieldError(state, "saleQuantity") ? <span className="text-xs text-red-600">{fieldError(state, "saleQuantity")}</span> : null}
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Unit price
            <input name="unitPrice" required inputMode="decimal" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {fieldError(state, "unitPrice") ? <span className="text-xs text-red-600">{fieldError(state, "unitPrice")}</span> : null}
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Amount received
            <input name="received" inputMode="decimal" placeholder="0" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {fieldError(state, "received") ? <span className="text-xs text-red-600">{fieldError(state, "received")}</span> : null}
          </label>
        </fieldset>
      )}

      <SubmitButton blocked={isEarlyHarvest && !allowsEarlyHarvest} includesSale={includesSale} />
    </form>
  );
}
