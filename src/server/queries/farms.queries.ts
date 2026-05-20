import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type AccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

export function farmWhereForAccess(context: AccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    id: {
      in: context.assignedFarmIds
    }
  };
}

export async function getFarms(context: AccessContext) {
  return prisma.farm.findMany({
    where: farmWhereForAccess(context),
    include: {
      managers: {
        include: {
          manager: true
        }
      },
      blocks: {
        include: {
          seasons: true
        }
      },
      expenses: true,
      items: true
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function getFarmById(id: string, context: AccessContext) {
  return prisma.farm.findFirst({
    where:
      canAccessAllFarms(context.role)
        ? { id }
        : {
            AND: [{ id }, { id: { in: context.assignedFarmIds } }]
          },
    include: {
      managers: {
        include: {
          manager: true
        }
      },
      blocks: {
        include: {
          seasons: true
        },
        orderBy: {
          name: "asc"
        }
      },
      expenses: {
        orderBy: {
          expenseDate: "desc"
        }
      },
      items: {
        orderBy: {
          name: "asc"
        }
      }
    }
  });
}

export async function getLandBlocks(context: AccessContext) {
  return prisma.landBlock.findMany({
    where:
      canAccessAllFarms(context.role)
        ? {}
        : {
            farmId: {
              in: context.assignedFarmIds
            }
          },
    include: {
      farm: true,
      seasons: true
    },
    orderBy: [{ farm: { name: "asc" } }, { name: "asc" }]
  });
}

export async function getLandBlockById(id: string, context: AccessContext) {
  return prisma.landBlock.findFirst({
    where: {
      id,
      ...(canAccessAllFarms(context.role)
        ? {}
        : {
            farmId: {
              in: context.assignedFarmIds
            }
          })
    },
    include: {
      farm: true,
      seasons: true
    }
  });
}
