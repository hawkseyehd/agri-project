import Link from "next/link";
import { BarChart3, Boxes, CheckCircle2, ClipboardList, Coins, LayoutDashboard, Leaf, MapPinned, ShieldCheck, UsersRound } from "lucide-react";

import { PublicCta, PublicPageShell, publicHighlights } from "@/components/layout/PublicLayout";

const workflows = [
  { label: "Daily field reports", icon: ClipboardList },
  { label: "Labor and wages", icon: UsersRound },
  { label: "Inventory alerts", icon: Boxes },
  { label: "Harvest and sales", icon: BarChart3 },
  { label: "Expenses in PKR", icon: Coins },
  { label: "Farm and block records", icon: MapPinned }
];

const operatingRhythm = [
  "Record daily work, crop activity, labor, and input usage.",
  "Review low-stock signals, wages, expenses, and pending collections.",
  "Give owners and managers the same operating picture before decisions are made."
];

export default function HomePage() {
  return (
    <PublicPageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              <Leaf className="h-4 w-4" />
              Agriculture Management MVP
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Practical farm operations control for growing teams in Pakistan.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              EgriProject helps owners, managers, accountants, and field staff coordinate farms, crop seasons, reports, labor, inventory, expenses, harvest sales, and receivables without losing the daily picture.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PublicCta href="/register">Get Started</PublicCta>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                About Us
              </Link>
              <Link href="/team" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Our Team
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-[#f7f9f5] p-4 shadow-sm">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Live workspace</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">Farm Operations Overview</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Active</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Active seasons", "12"],
                  ["Today's reports", "8/11"],
                  ["Low stock alerts", "4"],
                  ["Receivable", "PKR 1.8M"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-900">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {operatingRhythm.map((item) => (
                  <p key={item} className="flex gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {publicHighlights.slice(0, 4).map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-emerald-700" />
              <h2 className="mt-4 text-base font-bold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Public pathways</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Choose where you want to go first.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              New visitors can understand the product and team, while returning users can jump straight into operational work.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/register", label: "Get Started", helper: "Create an account and request package approval.", icon: LayoutDashboard },
              { href: "/about", label: "About Us", helper: "See what EgriProject is built to solve.", icon: ShieldCheck },
              { href: "/team", label: "Our Team", helper: "Meet the product and farm operations roles.", icon: UsersRound },
              { href: "/contact", label: "Contact", helper: "Start an onboarding or support conversation.", icon: Leaf }
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-slate-200 bg-[#f7f9f5] p-4 hover:border-emerald-200 hover:bg-emerald-50">
                <item.icon className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-slate-950">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.helper}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-emerald-900 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Ready for the workday</p>
              <h2 className="mt-2 text-2xl font-bold">Open your operational dashboard.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                Continue to farms, reports, inventory, labor, expenses, harvest sales, and management reports.
              </p>
            </div>
            <Link href="/register" className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
              Get Started
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
