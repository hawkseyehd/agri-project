import Link from "next/link";
import { ArrowRight, Leaf, LayoutDashboard, Mail, Sprout, UsersRound } from "lucide-react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

const publicLinks = [
  { href: "/about", label: "About Us" },
  { href: "/team", label: "Our Team" },
  { href: "/contact", label: "Contact" }
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-5 text-emerald-950">EgriProject</span>
            <span className="block text-xs font-medium text-slate-500">Farm. Manage. Grow.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
          {publicLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 sm:flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/login" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            Sign in
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden" aria-label="Public mobile navigation">
        {[{ href: "/dashboard", label: "Dashboard" }, ...publicLinks].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 text-sm text-slate-600 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <p className="font-bold text-slate-950">EgriProject</p>
          </div>
          <p className="mt-3 max-w-md">
            Agriculture management software for Pakistani farm owners, managers, accountants, and field teams.
          </p>
        </div>
        <div>
          <p className="font-bold text-slate-900">Public Pages</p>
          <div className="mt-3 grid gap-2">
            {publicLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-emerald-800">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-bold text-slate-900">Workspace</p>
          <div className="mt-3 grid gap-2">
            <Link href="/dashboard" className="hover:text-emerald-800">
              Dashboard
            </Link>
            <Link href="/reports" className="hover:text-emerald-800">
              Reports
            </Link>
            <Link href="/inventory" className="hover:text-emerald-800">
              Inventory
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9f5] text-slate-900">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

export function PublicCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function PublicSectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export const publicHighlights = [
  { title: "Field Operations", description: "Track farms, blocks, crop seasons, daily reports, and labor from one place.", icon: Sprout },
  { title: "Financial Control", description: "Monitor expenses, wages, harvest sales, receivables, and profit estimates in PKR.", icon: LayoutDashboard },
  { title: "Team Accountability", description: "Give owners, managers, accountants, and field staff role-aware access to the work.", icon: UsersRound },
  { title: "Support", description: "Plan onboarding and data migration around the way your farms already operate.", icon: Mail }
];
