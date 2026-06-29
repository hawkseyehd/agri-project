import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type AccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

function farmAccessFilter(context: AccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    block: {
      farmId: {
        in: context.assignedFarmIds
      }
    }
  };
}

export async function getCropSeasons(context: AccessContext) {
  return prisma.cropSeason.findMany({
    where: {
      archivedAt: null,
      ...farmAccessFilter(context)
    },
    include: {
      block: {
        include: {
          farm: true
        }
      },
      harvests: {
        where: { archivedAt: null }
      },
      expenses: true
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }]
  });
}

export async function getCropSeasonById(id: string, context: AccessContext) {
  return prisma.cropSeason.findFirst({
    where: {
      id,
      archivedAt: null,
      ...farmAccessFilter(context)
    },
    include: {
      block: {
        include: {
          farm: true
        }
      },
      reports: {
        orderBy: {
          reportDate: "desc"
        }
      },
      harvests: {
        where: { archivedAt: null },
        orderBy: {
          harvestDate: "desc"
        }
      },
      sales: {
        where: { archivedAt: null },
        orderBy: {
          saleDate: "desc"
        }
      },
      expenses: {
        orderBy: {
          expenseDate: "desc"
        }
      }
    }
  });
}

export async function getAccessibleLandBlocks(context: AccessContext) {
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
      farm: true
    },
    orderBy: [{ farm: { name: "asc" } }, { name: "asc" }]
  });
}
