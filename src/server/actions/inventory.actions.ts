"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { recordInventoryMovement, type InventoryMovementType } from "@/server/services/inventory.service";
import { inventoryItemSchema, inventoryMovementSchema } from "@/server/validators/inventory.schema";

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

function formBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

async function assertFarmAccess(farmId: string, action: "create" | "edit") {
  const user = await getSessionUser();
  const sessionUser = getAuthenticatedSessionUser(await auth());

  if (!user?.role) {
    throw new Error("You must be signed in to manage inventory.");
  }

  if (!canAccessFarm(user.role, user.assignedFarmIds ?? [], farmId)) {
    throw new Error("You do not have access to this farm.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "INVENTORY", action);
  }
}

async function assertItemAccess(itemId: string, action: "create" | "edit") {
  const item = await prisma.inventoryItem.findUnique({
    where: {
      id: itemId
    },
    select: {
      farmId: true
    }
  });

  if (!item) {
    throw new Error("Inventory item was not found.");
  }

  await assertFarmAccess(item.farmId, action);
}

export async function createInventoryItemAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inventoryItemSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    name: formValue(formData, "name"),
    itemType: formValue(formData, "itemType"),
    unit: formValue(formData, "unit"),
    quantity: formValue(formData, "quantity"),
    lowStockLevel: formValue(formData, "lowStockLevel")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted inventory fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertFarmAccess(parsed.data.farmId, "create");

    await prisma.inventoryItem.create({
      data: {
        farmId: parsed.data.farmId,
        name: parsed.data.name,
        itemType: parsed.data.itemType,
        unit: parsed.data.unit,
        quantity: parsed.data.quantity,
        lowStockLevel: parsed.data.lowStockLevel
      }
    });

    revalidatePath("/inventory");

    return {
      ok: true,
      message: "Inventory item saved."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Inventory item could not be saved."
    };
  }
}

export async function updateInventoryItemAction(id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inventoryItemSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    name: formValue(formData, "name"),
    itemType: formValue(formData, "itemType"),
    unit: formValue(formData, "unit"),
    quantity: formValue(formData, "quantity"),
    lowStockLevel: formValue(formData, "lowStockLevel")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted inventory fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertFarmAccess(parsed.data.farmId, "edit");

    await prisma.inventoryItem.update({
      where: {
        id
      },
      data: {
        farmId: parsed.data.farmId,
        name: parsed.data.name,
        itemType: parsed.data.itemType,
        unit: parsed.data.unit,
        quantity: parsed.data.quantity,
        lowStockLevel: parsed.data.lowStockLevel
      }
    });

    revalidatePath("/inventory");

    return {
      ok: true,
      message: "Inventory item updated."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Inventory item could not be updated."
    };
  }
}

export async function recordInventoryMovementAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inventoryMovementSchema.safeParse({
    itemId: formValue(formData, "itemId"),
    type: formValue(formData, "type"),
    quantity: formValue(formData, "quantity"),
    notes: formValue(formData, "notes"),
    allowNegativeStock: formBoolean(formData, "allowNegativeStock")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted movement fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await assertItemAccess(parsed.data.itemId, "create");

    const result = await recordInventoryMovement({
      itemId: parsed.data.itemId,
      type: parsed.data.type as InventoryMovementType,
      quantity: Number(parsed.data.quantity),
      notes: parsed.data.notes,
      allowNegativeStock: parsed.data.allowNegativeStock
    });

    revalidatePath("/inventory");

    return {
      ok: true,
      message: result.lowStock ? "Movement recorded. This item is at or below its low-stock level." : "Movement recorded."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Inventory movement could not be recorded."
    };
  }
}
