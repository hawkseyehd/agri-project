"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { saleSchema } from "@/server/validators/sale.schema";

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

async function assertCropSeasonAccess(cropSeasonId: string, action: "create" | "edit" | "delete") {
  const user = await getSessionUser();
  const sessionUser = getAuthenticatedSessionUser(await auth());

  if (!user?.role) {
    throw new Error("You must be signed in to manage sales.");
  }

  const season = await prisma.cropSeason.findUnique({
    where: {
      id: cropSeasonId
    },
    select: {
      archivedAt: true,
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

  if (season.archivedAt) {
    throw new Error("Selected crop season is archived.");
  }

  if (!canAccessFarm(user.role, user.assignedFarmIds ?? [], season.block.farmId)) {
    throw new Error("You do not have access to this crop season.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "HARVEST_SALES", action);
  }
}

async function assertHarvestMatchesSeason(harvestId: string | undefined, cropSeasonId: string) {
  if (!harvestId) {
    return;
  }

  const harvest = await prisma.harvest.findUnique({
    where: {
      id: harvestId
    },
    select: {
      cropSeasonId: true
    }
  });

  if (!harvest) {
    throw new Error("Selected harvest was not found.");
  }

  if (harvest.cropSeasonId !== cropSeasonId) {
    throw new Error("Selected harvest does not belong to this crop season.");
  }
}

export async function createSaleAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = saleSchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    harvestId: formValue(formData, "harvestId"),
    buyerName: formValue(formData, "buyerName"),
    quantity: formValue(formData, "quantity"),
    unitPrice: formValue(formData, "unitPrice"),
    saleDate: formValue(formData, "saleDate"),
    received: formValue(formData, "received") || "0"
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted sale fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertCropSeasonAccess(parsed.data.cropSeasonId, "create");
    await assertHarvestMatchesSeason(parsed.data.harvestId, parsed.data.cropSeasonId);

    await prisma.sale.create({
      data: {
        cropSeasonId: parsed.data.cropSeasonId,
        harvestId: parsed.data.harvestId,
        buyerName: parsed.data.buyerName,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        saleDate: new Date(parsed.data.saleDate),
        received: parsed.data.received
      }
    });

    revalidatePath("/harvest-sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Sale recorded."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sale could not be recorded."
    };
  }
}

export async function updateSaleAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = saleSchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    harvestId: formValue(formData, "harvestId"),
    buyerName: formValue(formData, "buyerName"),
    quantity: formValue(formData, "quantity"),
    unitPrice: formValue(formData, "unitPrice"),
    saleDate: formValue(formData, "saleDate"),
    received: formValue(formData, "received") || "0"
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted sale fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertCropSeasonAccess(parsed.data.cropSeasonId, "edit");
    await assertHarvestMatchesSeason(parsed.data.harvestId, parsed.data.cropSeasonId);

    await prisma.sale.update({
      where: {
        id
      },
      data: {
        cropSeasonId: parsed.data.cropSeasonId,
        harvestId: parsed.data.harvestId,
        buyerName: parsed.data.buyerName,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        saleDate: new Date(parsed.data.saleDate),
        received: parsed.data.received
      }
    });

    revalidatePath("/harvest-sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Sale updated."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sale could not be updated."
    };
  }
}

export async function archiveSaleAction(id: string): Promise<ActionState> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      select: { cropSeasonId: true }
    });

    if (!sale) {
      throw new Error("Sale was not found.");
    }

    await assertCropSeasonAccess(sale.cropSeasonId, "delete");
    await prisma.sale.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sale could not be archived."
    };
  }

  revalidatePath("/harvest-sales");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { ok: true, message: "Sale archived." };
}
