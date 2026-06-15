"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageTenant } from "@/server/auth/permissions";
import { auth, getSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { prisma } from "@/server/db/prisma";
import { createFarm, updateFarm } from "@/server/services/farms/mutations.service";
import { getPackageBlockLimit } from "@/server/services/subscriptions/subscription.service";
import { farmSchema, farmWithInitialBlockSchema } from "@/server/validators/farm-land.schema";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type SessionUser = {
  role?: Role;
  id?: string;
};

async function requireFarmManagement() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.role || !canManageTenant(user.role)) {
    throw new Error("Only land owner or platform admin users can manage farms.");
  }

  if (!user.id) {
    throw new Error("Sign in to manage farms.");
  }

  return user;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const farmFieldNames = [
  "name",
  "address",
  "area",
  "type",
  "location",
  "farmCode",
  "village",
  "city",
  "district",
  "region",
  "country",
  "gpsCoordinates",
  "boundaryGeoJson",
  "registrationNumber",
  "landRecordNumber",
  "leaseStartDate",
  "leaseEndDate",
  "contactPerson",
  "contactPhone",
  "description",
  "soilType",
  "soilPh",
  "organicMatterLevel",
  "salinityIssue",
  "lastSoilTestDate",
  "fertilityNotes",
  "knownProblems",
  "irrigationMethod",
  "waterSource",
  "waterSourcesCount",
  "pumpType",
  "waterAvailability",
  "irrigationEnergySource",
  "waterScheduleNotes",
  "permanentWorkersCount",
  "seasonalWorkersCount",
  "defaultDailyWage",
  "inventoryNotes",
  "equipmentNotes",
  "openingBalance",
  "currency",
  "seasonalBudget",
  "expenseCategories",
  "documentsNotes",
  "alertsNotes",
  "managerNotes"
] as const;

function farmPayload(formData: FormData) {
  return Object.fromEntries(farmFieldNames.map((field) => [field, formValue(formData, field)]));
}

async function assertOwnerCanCreateBlocks(ownerId: string, packageTier: "NONE" | "SILVER" | "GOLD" | "PLATINUM", additionalBlocks: number) {
  if (additionalBlocks === 0) {
    return;
  }

  const limit = getPackageBlockLimit(packageTier);
  if (limit === 0) {
    throw new Error("Choose an approved package before creating farm blocks.");
  }

  const currentBlocks = await prisma.landBlock.count({
    where: {
      farm: {
        ownerId
      }
    }
  });

  if (currentBlocks + additionalBlocks > limit) {
    throw new Error(`Your package allows up to ${limit} farm blocks.`);
  }
}

export async function createFarmAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = farmWithInitialBlockSchema.safeParse({
    ...farmPayload(formData),
    initialBlockName: formValue(formData, "initialBlockName"),
    initialBlockAreaAcres: formValue(formData, "initialBlockAreaAcres"),
    initialBlockBoundaryGeoJson: formValue(formData, "initialBlockBoundaryGeoJson")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted farm fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  let farmId: string;

  try {
    const user = await requireFarmManagement();
    const sessionUser = getSessionUser(await auth());
    if (sessionUser) {
      assertCanUsePageAction(sessionUser, "FARMS", "create");
    }
    if (sessionUser?.role === "LAND_OWNER") {
      await assertOwnerCanCreateBlocks(sessionUser.id, sessionUser.packageTier, parsed.data.initialBlockName ? 1 : 0);
    }
    const farm = await createFarm(prisma, parsed.data);
    if (user.role === "LAND_OWNER" || user.role === "OWNER") {
      await prisma.farm.update({
        where: {
          id: farm.id
        },
        data: {
          ownerId: user.id,
          managers: {
            create: {
              manager: {
                connect: {
                  id: user.id
                }
              }
            }
          }
        }
      });
    }
    farmId = farm.id;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Farm could not be created."
    };
  }

  revalidatePath("/farms");
  redirect(`/farms/${farmId}`);
}

export async function updateFarmAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = farmSchema.safeParse(farmPayload(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted farm fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const user = getSessionUser(await auth());
    if (user) {
      assertCanUsePageAction(user, "FARMS", "edit");
    }
    await requireFarmManagement();
    await updateFarm(prisma, id, parsed.data);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Farm could not be updated."
    };
  }

  revalidatePath("/farms");
  revalidatePath(`/farms/${id}`);
  redirect(`/farms/${id}`);
}
