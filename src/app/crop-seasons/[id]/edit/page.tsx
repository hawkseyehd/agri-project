import Link from "next/link";
import { notFound } from "next/navigation";

import { CropSeasonForm } from "@/app/crop-seasons/_components/CropSeasonForm";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel } from "@/components/ui/dashboard";
import { updateCropSeasonAction } from "@/server/actions/crop-seasons.actions";
import { auth } from "@/server/auth/auth";
import { getAccessibleLandBlocks, getCropSeasonById, type AccessContext } from "@/server/queries/crop-seasons.queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

export default async function EditCropSeasonPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return (
      <AppShell>
        <PageHeader eyebrow="Crop Seasons" title="Edit Crop Season" description="Update lifecycle status, dates, crop, variety, or block." />
        <Panel className="mt-5">
          <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Sign in to edit crop seasons.</p>
        </Panel>
      </AppShell>
    );
  }

  const [season, blocks] = await Promise.all([getCropSeasonById(id, access), getAccessibleLandBlocks(access)]);

  if (!season) {
    notFound();
  }

  const action = updateCropSeasonAction.bind(null, season.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href={`/crop-seasons/${season.id}`} className="text-sm font-semibold text-emerald-800 hover:underline">
          Back to crop season
        </Link>
        <PageHeader eyebrow="Crop Seasons" title="Edit Crop Season" description="Update lifecycle status, dates, crop, variety, or land block assignment." />
        <CropSeasonForm
          action={action}
          blocks={blocks}
          defaultValues={{
            blockId: season.blockId,
            cropType: season.cropType,
            cropName: season.cropName,
            variety: season.variety,
            startDate: season.startDate,
            endDate: season.endDate,
            harvestTiming: season.harvestTiming,
            status: season.status
          }}
          submitLabel="Save crop season"
        />
      </div>
    </AppShell>
  );
}
