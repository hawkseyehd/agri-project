import Link from "next/link";
import { BarChart3, ClipboardList, Coins, Leaf, MapPinned, ShieldCheck } from "lucide-react";

import { PublicCta, PublicPageShell, PublicSectionHeader } from "@/components/layout/PublicLayout";

const priorities = [
  { title: "Operational clarity", description: "Farm owners and managers can see daily reports, crop activity, labor, and inventory signals together.", icon: ClipboardList },
  { title: "Financial discipline", description: "Accountants can connect expenses, wages, harvest sales, receivables, and profit estimates in PKR.", icon: Coins },
  { title: "Local farm structure", description: "Farms, land blocks, crop seasons, and field staff are modeled around practical agriculture workflows.", icon: MapPinned },
  { title: "Role-aware access", description: "Teams can work from a shared system while keeping sensitive records scoped to the right users.", icon: ShieldCheck }
];

export default function AboutPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <PublicSectionHeader
            eyebrow="About Us"
            title="EgriProject is built for farm teams that need the daily picture and the business picture together."
            description="The MVP focuses on the core operating loop for agriculture businesses in Pakistan: farms and land blocks, crop seasons, daily work, labor, inventory, expenses, harvest sales, reports, and alerts."
          />
          <div className="mt-7 flex flex-wrap gap-3">
            <PublicCta href="/dashboard">Open Dashboard</PublicCta>
            <Link href="/team" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Meet Our Team
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8 xl:grid-cols-4">
        {priorities.map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <item.icon className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-4 text-base font-bold text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Why it exists</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Less scattered record keeping, more confident decisions.</h2>
          </div>
          <div className="grid gap-4 text-sm leading-7 text-slate-600">
            <p>
              Farm teams often manage field notes, purchases, wages, stock, and sales in separate notebooks, spreadsheets, and messages. EgriProject brings those records into one connected workspace so managers can act on current information.
            </p>
            <p>
              The product keeps its first release practical: it helps teams capture daily reports, watch operational signals, and review farm performance without forcing a complicated enterprise rollout.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Daily control", description: "Submit and review field reports before the next workday starts.", icon: Leaf },
            { title: "Management reports", description: "Compare expenses, revenue, receivables, and activity by farm or season.", icon: BarChart3 },
            { title: "Team readiness", description: "Support owners, managers, accountants, and field staff in one operating rhythm.", icon: ShieldCheck }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-emerald-700" />
              <h3 className="mt-4 font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
