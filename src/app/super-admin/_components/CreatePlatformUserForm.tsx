"use client";

import { useFormState, useFormStatus } from "react-dom";

import { createPlatformUserAction, type SuperAdminActionState } from "@/server/actions/super-admin.actions";

const packageOptions = [
  { value: "NONE", label: "Default" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "PLATINUM", label: "Platinum" }
] as const;

function fieldError(state: SuperAdminActionState, key: string) {
  return state.errors?.[key]?.[0];
}

function ActionMessage({ state }: { state: SuperAdminActionState }) {
  if (!state.message) {
    return null;
  }

  const className = state.ok
    ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
    : "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900";

  return <div className={className}>{state.message}</div>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create user"}
    </button>
  );
}

export function CreatePlatformUserForm() {
  const [state, formAction] = useFormState(createPlatformUserAction, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      <ActionMessage state={state} />

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Name
          <input name="name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "name") ? <span className="block text-xs text-red-600">{fieldError(state, "name")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" autoComplete="off" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "email") ? <span className="block text-xs text-red-600">{fieldError(state, "email")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Password
          <input name="password" type="password" autoComplete="new-password" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "password") ? <span className="block text-xs text-red-600">{fieldError(state, "password")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          Subscription tier
          <select name="packageTier" defaultValue="NONE" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            {packageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError(state, "packageTier") ? <span className="block text-xs text-red-600">{fieldError(state, "packageTier")}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700 lg:col-span-2">
          Expiration date
          <input name="subscriptionExpiresAt" type="datetime-local" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "subscriptionExpiresAt") ? <span className="block text-xs text-red-600">{fieldError(state, "subscriptionExpiresAt")}</span> : null}
        </label>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
