import Link from "next/link";

import { PublicPageShell } from "@/components/layout/PublicLayout";
import { requestPlanFormAction } from "@/server/actions/onboarding.actions";
import { auth, getSessionUser } from "@/server/auth/auth";

const packages = [
  {
    name: "Silver",
    tier: "SILVER",
    price: "$10/mo",
    helper: "Core dashboard and farm records for your land.",
    detail: "Best for a single owner managing their own data with up to 5 farm blocks."
  },
  {
    name: "Gold",
    tier: "GOLD",
    price: "$25/mo",
    helper: "Silver plus user management for up to 3 users.",
    detail: "Create farm-specific users and manage up to 10 farm blocks."
  },
  {
    name: "Platinum",
    tier: "PLATINUM",
    price: "$50/mo",
    helper: "Gold permissions with up to 5 users.",
    detail: "For larger farm operations with up to 20 farm blocks."
  }
] as const;

export default async function GetStartedPage({ searchParams }: { searchParams?: { requested?: string } }) {
  const user = getSessionUser(await auth());
  const isPendingUser = user?.role === "PENDING_USER";

  return (
    <PublicPageShell>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-bold uppercase text-emerald-700">Get Started</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">Choose your package and wait for approval.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Package selection creates an approval request. A platform super admin activates dashboard access, then you can name your company.
        </p>

        {searchParams?.requested ? (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            Plan request saved. A super admin can now approve your access.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {packages.map((item) => (
            <article key={item.name} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">{item.name}</h2>
                <p className="rounded-md bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-800">{item.price}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-emerald-800">{item.helper}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
              {isPendingUser ? (
                <form action={requestPlanFormAction} className="mt-4">
                  <input type="hidden" name="packageTier" value={item.tier} />
                  <button
                    type="submit"
                    className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Request {item.name}
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </div>

        {isPendingUser && user.packageTier !== "NONE" ? (
          <p className="mt-4 text-sm text-slate-600">
            Current requested plan: <span className="font-semibold text-slate-900">{user.packageTier}</span>
          </p>
        ) : null}

        <div className="mt-8 flex gap-3">
          <Link href="/login" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            Back to sign in
          </Link>
          <Link href="/" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Landing page
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
