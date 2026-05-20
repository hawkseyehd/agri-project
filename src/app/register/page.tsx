import { Leaf } from "lucide-react";

import { RegisterForm } from "@/app/register/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen bg-[#f7f9f5] lg:grid-cols-[0.85fr_1.15fr]">
      <section className="flex flex-col justify-between border-r border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Leaf className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-bold leading-6 text-emerald-900">EgriManage</p>
            <p className="text-sm font-medium text-slate-500">Farm. Manage. Grow.</p>
          </div>
        </div>
        <div className="my-14 max-w-md">
          <p className="text-sm font-bold uppercase text-emerald-700">SaaS Access</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Create your farm workspace request.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            New accounts start with landing-page access. Choose a package after sign-in, then a platform admin approves dashboard access.
          </p>
        </div>
        <p className="text-xs text-slate-500">Silver, Gold, and Platinum packages are available after registration.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Register</h2>
          <p className="mt-1 text-sm text-slate-500">Create a pending account for admin approval.</p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
