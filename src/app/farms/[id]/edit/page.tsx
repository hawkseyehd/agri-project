import Link from "next/link";
import { notFound } from "next/navigation";

import { FarmForm } from "@/app/farms/_components/FarmForm";
import { AppShell } from "@/components/layout/AppShell";
import { updateFarmAction } from "@/server/actions/farms.actions";
import { auth } from "@/server/auth/auth";
import { getFarmById, type AccessContext } from "@/server/queries/farms.queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getAccessContext(sessionUser: unknown): AccessContext | null {
  const user = sessionUser as Partial<AccessContext> | undefined;
  return user?.role ? { role: user.role, assignedFarmIds: user.assignedFarmIds ?? [] } : null;
}

function formDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function farmFormDefaults(farm: NonNullable<Awaited<ReturnType<typeof getFarmById>>>) {
  return {
    name: farm.name,
    location: farm.location,
    address: farm.address,
    area: String(farm.area),
    type: farm.type,
    farmCode: farm.farmCode,
    village: farm.village,
    city: farm.city,
    district: farm.district,
    region: farm.region,
    country: farm.country,
    gpsCoordinates: farm.gpsCoordinates,
    registrationNumber: farm.registrationNumber,
    landRecordNumber: farm.landRecordNumber,
    leaseStartDate: formDate(farm.leaseStartDate),
    leaseEndDate: formDate(farm.leaseEndDate),
    contactPerson: farm.contactPerson,
    contactPhone: farm.contactPhone,
    description: farm.description,
    soilType: farm.soilType,
    soilPh: farm.soilPh ? String(farm.soilPh) : null,
    organicMatterLevel: farm.organicMatterLevel,
    salinityIssue: farm.salinityIssue,
    lastSoilTestDate: formDate(farm.lastSoilTestDate),
    fertilityNotes: farm.fertilityNotes,
    knownProblems: farm.knownProblems,
    irrigationMethod: farm.irrigationMethod,
    waterSource: farm.waterSource,
    waterSourcesCount: farm.waterSourcesCount,
    pumpType: farm.pumpType,
    waterAvailability: farm.waterAvailability,
    irrigationEnergySource: farm.irrigationEnergySource,
    waterScheduleNotes: farm.waterScheduleNotes,
    permanentWorkersCount: farm.permanentWorkersCount,
    seasonalWorkersCount: farm.seasonalWorkersCount,
    defaultDailyWage: farm.defaultDailyWage ? String(farm.defaultDailyWage) : null,
    inventoryNotes: farm.inventoryNotes,
    equipmentNotes: farm.equipmentNotes,
    openingBalance: farm.openingBalance ? String(farm.openingBalance) : null,
    currency: farm.currency,
    seasonalBudget: farm.seasonalBudget ? String(farm.seasonalBudget) : null,
    expenseCategories: farm.expenseCategories,
    documentsNotes: farm.documentsNotes,
    alertsNotes: farm.alertsNotes,
    managerNotes: farm.managerNotes
  };
}

export default async function EditFarmPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const access = getAccessContext(session?.user);

  if (!access) {
    return null;
  }

  const farm = await getFarmById(id, access);

  if (!farm) {
    notFound();
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <Link href={`/farms/${farm.id}`} className="text-sm font-medium text-emerald-800 hover:underline">
            Back to farm
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit Farm</h1>
          <p className="text-sm text-slate-600">Update farm identity, land records, soil, water, labor, inventory, finance, and management details.</p>
        </div>

        <FarmForm action={updateFarmAction.bind(null, farm.id)} defaultValues={farmFormDefaults(farm)} submitLabel="Save farm" />
      </main>
    </AppShell>
  );
}
