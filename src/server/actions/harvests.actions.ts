"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { harvestSchema } from "@/server/validators/harvest.schema";

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

async function assertCropSeasonAccess(cropSeasonId: string, action: "create" | "edit") {
  const user = await getSessionUser();
  const sessionUser = getAuthenticatedSessionUser(await auth());

  if (!user?.role) {
    throw new Error("You must be signed in to manage harvests.");
  }

  const season = await prisma.cropSeason.findUnique({
    where: {
      id: cropSeasonId
    },
    select: {
      block: {
        select: {
          farmId: true
        }
      }
    }
  });

  if (!season) {
    throw new Error("Selected crop season was not found.");
  }

  if (!canAccessFarm(user.role, user.assignedFarmIds ?? [], season.block.farmId)) {
    throw new Error("You do not have access to this crop season.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "HARVEST_SALES", action);
  }
}

export async function createHarvestAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = harvestSchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    quantity: formValue(formData, "quantity"),
    unit: formValue(formData, "unit"),
    harvestDate: formValue(formData, "harvestDate"),
    notes: formValue(formData, "notes")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted harvest fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertCropSeasonAccess(parsed.data.cropSeasonId, "create");

    await prisma.harvest.create({
      data: {
        cropSeasonId: parsed.data.cropSeasonId,
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
        harvestDate: new Date(parsed.data.harvestDate),
        notes: parsed.data.notes
      }
    });

    revalidatePath("/harvest-sales");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Harvest recorded."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Harvest could not be recorded."
    };
  }
}

export async function updateHarvestAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = harvestSchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    quantity: formValue(formData, "quantity"),
    unit: formValue(formData, "unit"),
    harvestDate: formValue(formData, "harvestDate"),
    notes: formValue(formData, "notes")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted harvest fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertCropSeasonAccess(parsed.data.cropSeasonId, "edit");

    await prisma.harvest.update({
      where: {
        id
      },
      data: {
        cropSeasonId: parsed.data.cropSeasonId,
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
        harvestDate: new Date(parsed.data.harvestDate),
        notes: parsed.data.notes
      }
    });

    revalidatePath("/harvest-sales");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Harvest updated."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Harvest could not be updated."
    };
  }
}
