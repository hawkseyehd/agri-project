"use client";

import type { ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { BoundaryDrawMap } from "@/components/maps/BoundaryDrawMap";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type FarmDefaultValues = Partial<Record<string, string | number | null>>;

type FarmFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: FarmDefaultValues;
  showInitialBlockFields?: boolean;
  submitLabel: string;
};

function fieldError(state: ActionState, key: string) {
  return state.errors?.[key]?.[0];
}

function defaultValue(defaultValues: FarmDefaultValues | undefined, key: string) {
  const value = defaultValues?.[key];
  return value === null || value === undefined ? "" : String(value);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-200 pt-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  state,
  name,
  label,
  defaultValues,
  required = false,
  type = "text"
}: {
  state: ActionState;
  name: string;
  label: string;
  defaultValues?: FarmDefaultValues;
  required?: boolean;
  type?: "text" | "number" | "date";
}) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        name={name}
        id={name}
        defaultValue={defaultValue(defaultValues, name)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        required={required}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
      />
      {fieldError(state, name) ? <span className="block text-xs text-red-600">{fieldError(state, name)}</span> : null}
    </label>
  );
}

function TextArea({ state, name, label, defaultValues }: { state: ActionState; name: string; label: string; defaultValues?: FarmDefaultValues }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      {label}
      <textarea name={name} defaultValue={defaultValue(defaultValues, name)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {fieldError(state, name) ? <span className="block text-xs text-red-600">{fieldError(state, name)}</span> : null}
    </label>
  );
}

function FarmTypeSelect({ state, defaultValues }: { state: ActionState; defaultValues?: FarmDefaultValues }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      Farm type
      <select name="type" defaultValue={defaultValue(defaultValues, "type")} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
        <option value="">Select type</option>
        <option value="OWNER">Owner</option>
        <option value="CONTRACTOR">Contractor</option>
        <option value="LEASE">Lease</option>
      </select>
      {fieldError(state, "type") ? <span className="block text-xs text-red-600">{fieldError(state, "type")}</span> : null}
    </label>
  );
}

export function FarmForm({ action, defaultValues, showInitialBlockFields = false, submitLabel }: FarmFormProps) {
  const [state, formAction] = useFormState(action, { ok: false });

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.message ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{state.message}</div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Farm identity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput state={state} name="name" label="Farm name" defaultValues={defaultValues} required />
          <FarmTypeSelect state={state} defaultValues={defaultValues} />
          <TextInput state={state} name="address" label="Address" defaultValues={defaultValues} required />
          <TextInput state={state} name="area" label="Area" defaultValues={defaultValues} required type="number" />
          <TextInput state={state} name="farmCode" label="Farm code" defaultValues={defaultValues} />
          <TextInput state={state} name="location" label="Location" defaultValues={defaultValues} />
        </div>
      </section>

      <BoundaryDrawMap fieldName="boundaryGeoJson" areaFieldId="area" defaultBoundary={defaultValue(defaultValues, "boundaryGeoJson")} />

      <Section title="Place and land records">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput state={state} name="village" label="Village or town" defaultValues={defaultValues} />
          <TextInput state={state} name="city" label="City" defaultValues={defaultValues} />
          <TextInput state={state} name="district" label="District" defaultValues={defaultValues} />
          <TextInput state={state} name="region" label="Region or province" defaultValues={defaultValues} />
          <TextInput state={state} name="country" label="Country" defaultValues={defaultValues} />
          <TextInput state={state} name="gpsCoordinates" label="GPS coordinates" defaultValues={defaultValues} />
          <TextInput state={state} name="registrationNumber" label="Registration number" defaultValues={defaultValues} />
          <TextInput state={state} name="landRecordNumber" label="Land record number" defaultValues={defaultValues} />
          <TextInput state={state} name="leaseStartDate" label="Lease start date" defaultValues={defaultValues} type="date" />
          <TextInput state={state} name="leaseEndDate" label="Lease end date" defaultValues={defaultValues} type="date" />
          <TextInput state={state} name="contactPerson" label="Main contact person" defaultValues={defaultValues} />
          <TextInput state={state} name="contactPhone" label="Contact phone" defaultValues={defaultValues} />
        </div>
        <TextArea state={state} name="description" label="Farm description" defaultValues={defaultValues} />
      </Section>

      <Section title="Soil and water">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput state={state} name="soilType" label="Soil type" defaultValues={defaultValues} />
          <TextInput state={state} name="soilPh" label="Soil pH" defaultValues={defaultValues} type="number" />
          <TextInput state={state} name="organicMatterLevel" label="Organic matter level" defaultValues={defaultValues} />
          <TextInput state={state} name="salinityIssue" label="Salinity issue" defaultValues={defaultValues} />
          <TextInput state={state} name="lastSoilTestDate" label="Last soil test date" defaultValues={defaultValues} type="date" />
          <TextInput state={state} name="irrigationMethod" label="Irrigation method" defaultValues={defaultValues} />
          <TextInput state={state} name="waterSource" label="Water source" defaultValues={defaultValues} />
          <TextInput state={state} name="waterSourcesCount" label="Water sources count" defaultValues={defaultValues} type="number" />
          <TextInput state={state} name="pumpType" label="Pump type or capacity" defaultValues={defaultValues} />
          <TextInput state={state} name="waterAvailability" label="Water availability" defaultValues={defaultValues} />
          <TextInput state={state} name="irrigationEnergySource" label="Irrigation energy source" defaultValues={defaultValues} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea state={state} name="fertilityNotes" label="Fertility notes" defaultValues={defaultValues} />
          <TextArea state={state} name="knownProblems" label="Known land problems" defaultValues={defaultValues} />
          <TextArea state={state} name="waterScheduleNotes" label="Water schedule notes" defaultValues={defaultValues} />
        </div>
      </Section>

      <Section title="Labor, inventory, and finance">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput state={state} name="permanentWorkersCount" label="Permanent workers count" defaultValues={defaultValues} type="number" />
          <TextInput state={state} name="seasonalWorkersCount" label="Seasonal workers count" defaultValues={defaultValues} type="number" />
          <TextInput state={state} name="defaultDailyWage" label="Default daily wage" defaultValues={defaultValues} type="number" />
          <TextInput state={state} name="openingBalance" label="Opening balance" defaultValues={defaultValues} type="number" />
          <TextInput state={state} name="currency" label="Currency" defaultValues={defaultValues} />
          <TextInput state={state} name="seasonalBudget" label="Seasonal budget" defaultValues={defaultValues} type="number" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea state={state} name="inventoryNotes" label="Starting inventory notes" defaultValues={defaultValues} />
          <TextArea state={state} name="equipmentNotes" label="Equipment and machinery notes" defaultValues={defaultValues} />
          <TextArea state={state} name="expenseCategories" label="Expense categories" defaultValues={defaultValues} />
        </div>
      </Section>

      <Section title="Documents, alerts, and management">
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea state={state} name="documentsNotes" label="Document notes" defaultValues={defaultValues} />
          <TextArea state={state} name="alertsNotes" label="Alert preferences" defaultValues={defaultValues} />
          <TextArea state={state} name="managerNotes" label="Manager notes" defaultValues={defaultValues} />
        </div>
      </Section>

      {showInitialBlockFields ? (
        <Section title="First land block">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Block name
              <input name="initialBlockName" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              {fieldError(state, "initialBlockName") ? <span className="block text-xs text-red-600">{fieldError(state, "initialBlockName")}</span> : null}
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Block area acres
              <input
                id="initialBlockAreaAcres"
                type="number"
                step="0.01"
                min="0"
                name="initialBlockAreaAcres"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldError(state, "initialBlockAreaAcres") ? (
                <span className="block text-xs text-red-600">{fieldError(state, "initialBlockAreaAcres")}</span>
              ) : null}
            </label>
          </div>
          <BoundaryDrawMap fieldName="initialBlockBoundaryGeoJson" areaFieldId="initialBlockAreaAcres" />
        </Section>
      ) : null}

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
