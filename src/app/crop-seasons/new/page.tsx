import Link from "next/link";

import { CropSeasonForm } from "@/app/crop-seasons/_components/CropSeasonForm";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel } from "@/components/ui/dashboard";
import { createCropSeasonAction } from "@/server/actions/crop-seasons.actions";
import { auth } from "@/server/auth/auth";
import { getAccessibleLandBlocks, type AccessContext } from "@/server/queries/crop-seasons.queries";

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

export default async function NewCropSeasonPage() {
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader eyebrow="Crop Seasons" title="New Crop Season" description="Create a crop cycle for an accessible land block." />
        <Panel className="mt-5">
          <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Sign in to create crop seasons.</p>
        </Panel>
      </AppShell>
    );
  }

  const blocks = await getAccessibleLandBlocks(access);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href="/crop-seasons" className="text-sm font-semibold text-emerald-800 hover:underline">
          Back to crop seasons
        </Link>
        <PageHeader eyebrow="Crop Seasons" title="New Crop Season" description="Create a crop cycle with block, crop, variety, sowing date, expected harvest, and lifecycle status." />
        <CropSeasonForm action={createCropSeasonAction} blocks={blocks} submitLabel="Create crop season" />
      </div>
    </AppShell>
  );
}
