import { Leaf } from "lucide-react";
import { Suspense } from "react";

import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7f9f5] lg:grid-cols-[0.85fr_1.15fr]">
      <section className="flex flex-col justify-between border-r border-slate-200 bg-white p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-700 text-white">
              <Leaf className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-6 text-emerald-900">EgriManage</p>
              <p className="text-sm font-medium text-slate-500">Farm. Manage. Grow.</p>
            </div>
          </div>
        </div>
        <div className="my-14 max-w-md">
          <p className="text-sm font-bold uppercase text-emerald-700">MVP Web App</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Farm operations in one clean workspace.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Track daily operations, expenses, labor, crop activity, inventory, irrigation, and end-of-day manager records.
          </p>
        </div>
        <p className="text-xs text-slate-500">Owner and manager access for assigned farms.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use your farm management account.</p>
          <Suspense fallback={<div className="mt-5 h-48 rounded-md border border-slate-200 bg-slate-50" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
