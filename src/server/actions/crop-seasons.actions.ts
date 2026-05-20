"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canAccessFarm } from "@/server/auth/permissions";
import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { prisma } from "@/server/db/prisma";
import { createCropSeason, updateCropSeason } from "@/server/services/crop-seasons/mutations.service";
import { cropSeasonSchema } from "@/server/validators/crop-season.schema";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type SessionUser = {
  id?: string;
  role?: Role;
  assignedFarmIds?: string[];
};

async function getSessionUser() {
  const session = await auth();
  return session?.user as SessionUser | undefined;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function assertBlockAccess(blockId: string, action: "create" | "edit") {
  const user = await getSessionUser();
  const sessionUser = getAuthenticatedSessionUser(await auth());
  if (!user?.role) {
    throw new Error("You must be signed in to manage crop seasons.");
  }

  const block = await prisma.landBlock.findUnique({
    where: {
      id: blockId
    },
    select: {
      farmId: true
    }
  });

  if (!block) {
    throw new Error("Selected land block was not found.");
  }

  if (!canAccessFarm(user.role, user.assignedFarmIds ?? [], block.farmId)) {
    throw new Error("You do not have access to this land block.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "CROP_SEASONS", action);
  }
}

export async function createCropSeasonAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cropSeasonSchema.safeParse({
    blockId: formValue(formData, "blockId"),
    cropType: formValue(formData, "cropType") || "CROP",
    cropName: formValue(formData, "cropName"),
    variety: formValue(formData, "variety"),
    startDate: formValue(formData, "startDate"),
    endDate: formValue(formData, "endDate"),
    harvestTiming: formValue(formData, "harvestTiming"),
    status: formValue(formData, "status") || "PLANNED"
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted crop season fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  let seasonId: string;

  try {
    await assertBlockAccess(parsed.data.blockId, "create");
    const season = await createCropSeason(prisma, parsed.data);

    seasonId = season.id;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Crop season could not be created."
    };
  }

  revalidatePath("/crop-seasons");
  redirect(`/crop-seasons/${seasonId}`);
}

export async function updateCropSeasonAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cropSeasonSchema.safeParse({
    blockId: formValue(formData, "blockId"),
    cropType: formValue(formData, "cropType") || "CROP",
    cropName: formValue(formData, "cropName"),
    variety: formValue(formData, "variety"),
    startDate: formValue(formData, "startDate"),
    endDate: formValue(formData, "endDate"),
    harvestTiming: formValue(formData, "harvestTiming"),
    status: formValue(formData, "status") || "PLANNED"
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted crop season fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertBlockAccess(parsed.data.blockId, "edit");
    await updateCropSeason(prisma, id, parsed.data);

  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Crop season could not be updated."
    };
  }

  revalidatePath("/crop-seasons");
  revalidatePath(`/crop-seasons/${id}`);
  redirect(`/crop-seasons/${id}`);
}
