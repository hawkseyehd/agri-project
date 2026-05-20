"use client";

import { useFormState, useFormStatus } from "react-dom";

import { createFirstFarmAction, type OnboardingActionState } from "@/server/actions/onboarding.actions";

function fieldError(state: OnboardingActionState, key: string) {
  return state.errors?.[key]?.[0];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving company..." : "Save company"}
    </button>
  );
}

export function FirstFarmSetupForm({ defaultCompanyName = "" }: { defaultCompanyName?: string | null }) {
  const [state, formAction] = useFormState(createFirstFarmAction, { ok: false });

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.message ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{state.message}</div> : null}

      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Company name
        <input name="companyName" defaultValue={defaultCompanyName ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        {fieldError(state, "companyName") ? <span className="block text-xs text-red-600">{fieldError(state, "companyName")}</span> : null}
      </label>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
