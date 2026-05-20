"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { toCurrentOrigin } from "@/lib/auth-redirect";
import { registerUserAction, type RegistrationActionState } from "@/server/actions/auth.actions";

const initialState: RegistrationActionState = {
  ok: false
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

function fieldError(errors: RegistrationActionState["errors"], key: string) {
  const message = errors?.[key]?.[0];
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export function RegisterForm() {
  const [state, formAction] = useFormState(registerUserAction, initialState);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    if (!state.ok || !credentials) {
      return;
    }

    void signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      callbackUrl: "/setup-farm",
      redirect: false
    }).then((result) => {
      window.location.href = toCurrentOrigin(result?.url, "/setup-farm", window.location.origin);
    });
  }, [credentials, state.ok]);

  function captureCredentials(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    setCredentials({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    });
  }

  return (
    <form action={formAction} onSubmit={captureCredentials} className="mt-5 space-y-4">
      {state.message ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</div> : null}

      <label className="block text-sm font-medium text-slate-700">
        Name
        <input name="name" autoComplete="name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        {fieldError(state.errors, "name")}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" autoComplete="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        {fieldError(state.errors, "email")}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Password
        <input name="password" type="password" autoComplete="new-password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        {fieldError(state.errors, "password")}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Confirm Password
        <input name="confirmPassword" type="password" autoComplete="new-password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        {fieldError(state.errors, "confirmPassword")}
      </label>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <a className="text-sm font-semibold text-emerald-800 hover:underline" href="/login">
          Sign in instead
        </a>
      </div>
    </form>
  );
}
