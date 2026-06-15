"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canAccessFarm } from "@/server/auth/permissions";
import { auth, getSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { prisma } from "@/server/db/prisma";
import { createLandBlock, updateLandBlock } from "@/server/services/farms/mutations.service";
import { getPackageBlockLimit } from "@/server/services/subscriptions/subscription.service";
import { landBlockSchema } from "@/server/validators/farm-land.schema";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type SessionUser = {
  role?: Role;
  assignedFarmIds?: string[];
};

async function requireFarmAccess(farmId: string, action: "create" | "edit") {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const sessionUser = getSessionUser(session);

  if (!user?.role || !canAccessFarm(user.role, user.assignedFarmIds ?? [], farmId)) {
    throw new Error("You do not have access to this farm.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "LAND_BLOCKS", action);
  }
}

async function assertFarmOwnerCanCreateBlock(farmId: string) {
  const farm = await prisma.farm.findUnique({
    where: {
      id: farmId
    },
    select: {
      ownerId: true,
      owner: {
        select: {
          packageTier: true
        }
      }
    }
  });

  if (!farm?.ownerId || !farm.owner) {
    return;
  }

  const limit = getPackageBlockLimit(farm.owner.packageTier);
  if (limit === 0) {
    throw new Error("The farm owner needs an approved package before creating farm blocks.");
  }

  const currentBlocks = await prisma.landBlock.count({
    where: {
      farm: {
        ownerId: farm.ownerId
      }
    }
  });

  if (currentBlocks + 1 > limit) {
    throw new Error(`This owner's package allows up to ${limit} farm blocks.`);
  }
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createLandBlockAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = landBlockSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    name: formValue(formData, "name"),
    areaAcres: formValue(formData, "areaAcres"),
    boundaryGeoJson: formValue(formData, "boundaryGeoJson")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted land block fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  let blockId: string;

  try {
    await requireFarmAccess(parsed.data.farmId, "create");
    await assertFarmOwnerCanCreateBlock(parsed.data.farmId);
    const block = await createLandBlock(prisma, parsed.data);
    blockId = block.id;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Land block could not be created."
    };
  }

  revalidatePath("/land-blocks");
  revalidatePath("/farms");
  redirect(`/farms/${formValue(formData, "farmId")}#block-${blockId}`);
}

export async function updateLandBlockAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = landBlockSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    name: formValue(formData, "name"),
    areaAcres: formValue(formData, "areaAcres"),
    boundaryGeoJson: formValue(formData, "boundaryGeoJson")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted land block fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await requireFarmAccess(parsed.data.farmId, "edit");
    await updateLandBlock(prisma, id, parsed.data);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Land block could not be updated."
    };
  }

  revalidatePath("/land-blocks");
  revalidatePath("/farms");
  redirect(`/farms/${parsed.data.farmId}#block-${id}`);
}
