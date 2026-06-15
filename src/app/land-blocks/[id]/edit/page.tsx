import Link from "next/link";
import { notFound } from "next/navigation";

import { LandBlockForm } from "@/app/land-blocks/_components/LandBlockForm";
import { AppShell } from "@/components/layout/AppShell";
import { updateLandBlockAction } from "@/server/actions/land-blocks.actions";
import { auth } from "@/server/auth/auth";
import { getFarms, getLandBlockById, type AccessContext } from "@/server/queries/farms.queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

export default async function EditLandBlockPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return null;
  }

  const [block, farms] = await Promise.all([getLandBlockById(id, access), getFarms(access)]);

  if (!block) {
    notFound();
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <Link href={`/farms/${block.farmId}`} className="text-sm font-medium text-emerald-800 hover:underline">
            Back to farm
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit Land Block</h1>
          <p className="text-sm text-slate-600">Update block name, acreage, or farm relationship.</p>
        </div>

        <LandBlockForm
          action={updateLandBlockAction.bind(null, block.id)}
          farms={farms}
          defaultValues={{
            farmId: block.farmId,
            name: block.name,
            areaAcres: block.areaAcres,
            boundaryGeoJson: block.boundaryGeoJson ? JSON.stringify(block.boundaryGeoJson) : null
          }}
          submitLabel="Save block"
        />
      </main>
    </AppShell>
  );
}
