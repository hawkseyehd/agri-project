import Link from "next/link";
import { Calculator, ClipboardCheck, Headphones, Leaf, ShieldCheck, Tractor, UsersRound } from "lucide-react";

import { PublicCta, PublicPageShell, PublicSectionHeader } from "@/components/layout/PublicLayout";

const teamRoles = [
  {
    name: "Product & Operations Lead",
    focus: "Turns farm management routines into clear software workflows for owners and managers.",
    icon: Tractor
  },
  {
    name: "Field Reporting Coordinator",
    focus: "Shapes daily reporting, labor tracking, crop activity, and staff accountability flows.",
    icon: ClipboardCheck
  },
  {
    name: "Finance & Inventory Advisor",
    focus: "Aligns expenses, wages, stock levels, harvest sales, receivables, and PKR reporting.",
    icon: Calculator
  },
  {
    name: "Implementation Support",
    focus: "Helps teams onboard farms, land blocks, crop seasons, users, and practical operating habits.",
    icon: Headphones
  }
];

export default function TeamPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <PublicSectionHeader
            eyebrow="Our Team"
            title="A practical product team focused on farm operations, finance, and field accountability."
            description="EgriProject is shaped around the people who keep agriculture businesses moving: farm owners, managers, accountants, supervisors, and field staff."
          />
          <div className="mt-7 flex flex-wrap gap-3">
            <PublicCta href="/contact">Contact the Team</PublicCta>
            <Link href="/dashboard" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        {teamRoles.map((member) => (
          <article key={member.name} className="rounded-lg border border-slate-200 bg-white p-5">
            <member.icon className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-4 text-lg font-bold text-slate-950">{member.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{member.focus}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">How we work</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Built with the realities of farm teams in mind.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Owner visibility", description: "High-level farm performance without chasing every record.", icon: ShieldCheck },
              { title: "Manager control", description: "Daily activity, staffing, inventory, and alerts in one place.", icon: UsersRound },
              { title: "Field adoption", description: "Simple reporting patterns that fit working farms.", icon: Leaf }
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-[#f7f9f5] p-4">
                <item.icon className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
