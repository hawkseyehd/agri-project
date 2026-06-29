import Link from "next/link";

import { FarmForm } from "@/app/farms/_components/FarmForm";
import { AppShell } from "@/components/layout/AppShell";
import { createFarmAction } from "@/server/actions/farms.actions";

export default function NewFarmPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <Link href="/farms" className="text-sm font-medium text-emerald-800 hover:underline">
            Back to farms
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">New Farm</h1>
          <p className="text-sm text-slate-600">Add the farm basics, draw its boundary, and include optional details when needed.</p>
        </div>

        <FarmForm action={createFarmAction} submitLabel="Create farm" />
      </main>
    </AppShell>
  );
}
