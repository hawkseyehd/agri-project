import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type InventoryAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

export type InventoryFilters = {
  farmId?: string;
  lowStockOnly?: boolean;
};

type StockLevelRecord = {
  quantity: unknown;
  lowStockLevel: unknown;
};

function farmAccessFilter(context: InventoryAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    farmId: {
      in: context.assignedFarmIds
    }
  };
}

export async function getInventoryItems(context: InventoryAccessContext, filters: InventoryFilters = {}) {
  const items = await prisma.inventoryItem.findMany({
    where: {
      ...farmAccessFilter(context),
      ...(filters.farmId ? { farmId: filters.farmId } : {})
    },
    include: {
      farm: true,
      movements: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }
    },
    orderBy: [{ farm: { name: "asc" } }, { name: "asc" }]
  });

  return filters.lowStockOnly
    ? items.filter((item: StockLevelRecord) => Number(item.quantity) <= Number(item.lowStockLevel))
    : items;
}

export async function getLowStockItems(context: InventoryAccessContext) {
  const items = await getInventoryItems(context);
  return items.filter((item: StockLevelRecord) => Number(item.quantity) <= Number(item.lowStockLevel));
}

export async function getInventoryMovementHistory(itemId: string, context: InventoryAccessContext) {
  return prisma.inventoryMovement.findMany({
    where: {
      itemId,
      item: farmAccessFilter(context)
    },
    include: {
      item: {
        include: {
          farm: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}
