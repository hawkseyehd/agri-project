import Link from "next/link";

import { LandBlockForm } from "@/app/land-blocks/_components/LandBlockForm";
import { AppShell } from "@/components/layout/AppShell";
import { createLandBlockAction } from "@/server/actions/land-blocks.actions";
import { auth } from "@/server/auth/auth";
import { getFarms, type AccessContext } from "@/server/queries/farms.queries";

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

export default async function NewLandBlockPage() {
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return null;
  }

  const farms = await getFarms(access);

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <Link href="/land-blocks" className="text-sm font-medium text-emerald-800 hover:underline">
            Back to land blocks
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">New Land Block</h1>
          <p className="text-sm text-slate-600">Map a block to an accessible farm so crop seasons can be created.</p>
        </div>

        <LandBlockForm action={createLandBlockAction} farms={farms} submitLabel="Create block" />
      </main>
    </AppShell>
  );
}
