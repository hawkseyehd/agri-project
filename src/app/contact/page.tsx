import Link from "next/link";
import { CalendarCheck, Mail, MapPin, MessageSquareText, Phone, ShieldCheck } from "lucide-react";

import { PublicCta, PublicPageShell, PublicSectionHeader } from "@/components/layout/PublicLayout";

const contactOptions = [
  { label: "Implementation", detail: "Plan farms, land blocks, users, and starting records.", icon: CalendarCheck },
  { label: "Product Support", detail: "Discuss reports, inventory, labor, expenses, and dashboard workflows.", icon: MessageSquareText },
  { label: "Data Readiness", detail: "Prepare spreadsheets or current records for migration into the MVP.", icon: ShieldCheck }
];

export default function ContactPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <PublicSectionHeader
            eyebrow="Contact"
            title="Talk to the EgriProject team about your farm management workflow."
            description="Use this page as the public starting point for onboarding, product questions, and support conversations. The MVP is designed for agriculture teams operating in Pakistan."
          />
          <div className="mt-7 flex flex-wrap gap-3">
            <PublicCta href="/dashboard">Open Dashboard</PublicCta>
            <Link href="/about" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Public contact details</h2>
          <div className="mt-5 grid gap-4 text-sm text-slate-600">
            <p className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              support@egriproject.local
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              Pakistan onboarding line
            </p>
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              Remote-first support for farm teams across Pakistan
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {contactOptions.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-emerald-700" />
              <h2 className="mt-4 font-bold text-slate-950">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
