"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { harvestEntrySchema, harvestSchema } from "@/server/validators/harvest.schema";

export type HarvestActionState = {
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
    throw new Error("You must be signed in to manage harvests.");
  }

  const season = await prisma.cropSeason.findUnique({
    where: {
      id: cropSeasonId
    },
    select: {
      id: true,
      cropName: true,
      endDate: true,
      archivedAt: true,
      block: {
        select: {
          id: true,
          farmId: true,
          farm: {
            select: {
              id: true,
              ownerId: true,
              name: true,
              city: true,
              district: true,
              region: true,
              country: true
            }
          }
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

  return season;
}

export async function createHarvestAction(_previousState: HarvestActionState, formData: FormData): Promise<HarvestActionState> {
  const parsed = harvestEntrySchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    quantity: formValue(formData, "quantity"),
    unit: formValue(formData, "unit"),
    harvestDate: formValue(formData, "harvestDate"),
    notes: formValue(formData, "notes"),
    includeSale: formValue(formData, "includeSale") === "true" ? "true" : "false",
    allowEarlyHarvest: formValue(formData, "allowEarlyHarvest") === "true" ? "true" : "false",
    buyerName: formValue(formData, "buyerName"),
    saleDate: formValue(formData, "saleDate"),
    saleQuantity: formValue(formData, "saleQuantity"),
    unitPrice: formValue(formData, "unitPrice"),
    received: formValue(formData, "received") || "0"
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const season = await assertCropSeasonAccess(parsed.data.cropSeasonId, "create");
    const harvestDate = new Date(parsed.data.harvestDate);

    if (season.endDate && harvestDate < season.endDate && parsed.data.allowEarlyHarvest !== "true") {
      throw new Error("Harvest date is before the expected harvest date. Confirm early harvest to continue.");
    }

    await prisma.$transaction(async (tx) => {
      const harvest = await tx.harvest.create({
        data: {
          cropSeasonId: parsed.data.cropSeasonId,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          harvestDate,
          notes: parsed.data.notes
        }
      });

      await tx.yieldRecord.create({
        data: {
          farmId: season.block.farm.id,
          landBlockId: season.block.id,
          cropSeasonId: season.id,
          harvestId: harvest.id,
          ownerId: season.block.farm.ownerId,
          cropName: season.cropName,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          yieldDate: harvestDate,
          farmName: season.block.farm.name,
          city: season.block.farm.city,
          district: season.block.farm.district,
          region: season.block.farm.region,
          country: season.block.farm.country,
          notes: parsed.data.notes
        }
      });

      if (parsed.data.includeSale === "true") {
        await tx.sale.create({
          data: {
            cropSeasonId: parsed.data.cropSeasonId,
            harvestId: harvest.id,
            buyerName: parsed.data.buyerName,
            quantity: parsed.data.saleQuantity,
            unitPrice: parsed.data.unitPrice,
            saleDate: new Date(parsed.data.saleDate),
            received: parsed.data.received
          }
        });
      }
    });

    revalidatePath("/harvest-sales");
    revalidatePath("/yields");
    revalidatePath("/super-admin/yields");
    revalidatePath("/dashboard");

    if (parsed.data.includeSale === "true") {
      revalidatePath("/reports");
    }

    return {
      ok: true,
      message: parsed.data.includeSale === "true" ? "Harvest and sale recorded." : "Harvest recorded."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Harvest could not be recorded."
    };
  }
}

export async function updateHarvestAction(id: string, _previousState: HarvestActionState, formData: FormData): Promise<HarvestActionState> {
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
    const season = await assertCropSeasonAccess(parsed.data.cropSeasonId, "edit");

    await prisma.$transaction(async (tx) => {
      await tx.harvest.update({
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

      await tx.yieldRecord.upsert({
        where: {
          harvestId: id
        },
        update: {
          farmId: season.block.farm.id,
          landBlockId: season.block.id,
          cropSeasonId: season.id,
          ownerId: season.block.farm.ownerId,
          cropName: season.cropName,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          yieldDate: new Date(parsed.data.harvestDate),
          farmName: season.block.farm.name,
          city: season.block.farm.city,
          district: season.block.farm.district,
          region: season.block.farm.region,
          country: season.block.farm.country,
          notes: parsed.data.notes
        },
        create: {
          farmId: season.block.farm.id,
          landBlockId: season.block.id,
          cropSeasonId: season.id,
          harvestId: id,
          ownerId: season.block.farm.ownerId,
          cropName: season.cropName,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          yieldDate: new Date(parsed.data.harvestDate),
          farmName: season.block.farm.name,
          city: season.block.farm.city,
          district: season.block.farm.district,
          region: season.block.farm.region,
          country: season.block.farm.country,
          notes: parsed.data.notes
        }
      });
    });

    revalidatePath("/harvest-sales");
    revalidatePath("/yields");
    revalidatePath("/super-admin/yields");
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

export async function archiveHarvestAction(id: string): Promise<HarvestActionState> {
  try {
    const harvest = await prisma.harvest.findUnique({
      where: { id },
      select: { cropSeasonId: true }
    });

    if (!harvest) {
      throw new Error("Harvest was not found.");
    }

    await assertCropSeasonAccess(harvest.cropSeasonId, "delete");
    await prisma.harvest.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Harvest could not be archived."
    };
  }

  revalidatePath("/harvest-sales");
  revalidatePath("/crop-seasons");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { ok: true, message: "Harvest archived." };
}
