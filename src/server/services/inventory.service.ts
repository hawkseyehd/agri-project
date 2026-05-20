import { prisma } from "@/server/db/prisma";

export type InventoryMovementType = "PURCHASE" | "USAGE" | "ADJUSTMENT" | "WASTAGE";

export type QuantityCalculationInput = {
  currentQuantity: number;
  movementType: InventoryMovementType;
  movementQuantity: number;
  allowNegativeStock?: boolean;
};

export function calculateInventoryQuantity({
  currentQuantity,
  movementType,
  movementQuantity,
  allowNegativeStock = false
}: QuantityCalculationInput) {
  const nextQuantity = movementType === "PURCHASE" ? currentQuantity + movementQuantity : currentQuantity - movementQuantity;

  if (nextQuantity < 0 && !allowNegativeStock) {
    throw new Error("Inventory movement would make stock negative.");
  }

  return nextQuantity;
}

export async function recordInventoryMovement(input: {
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  notes?: string;
  allowNegativeStock?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: {
        id: input.itemId
      }
    });

    if (!item) {
      throw new Error("Inventory item was not found.");
    }

    const nextQuantity = calculateInventoryQuantity({
      currentQuantity: Number(item.quantity),
      movementType: input.type,
      movementQuantity: input.quantity,
      allowNegativeStock: input.allowNegativeStock
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        itemId: input.itemId,
        type: input.type,
        quantity: input.quantity,
        notes: input.notes
      }
    });

    const updatedItem = await tx.inventoryItem.update({
      where: {
        id: input.itemId
      },
      data: {
        quantity: nextQuantity
      }
    });

    return {
      item: updatedItem,
      movement,
      lowStock: Number(updatedItem.quantity) <= Number(updatedItem.lowStockLevel)
    };
  });
}
