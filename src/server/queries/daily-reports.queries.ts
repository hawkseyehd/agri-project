import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";

export type DailyReportAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

function reportAccessFilter(context: DailyReportAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    cropSeason: {
      block: {
        farmId: {
          in: context.assignedFarmIds
        }
      }
    }
  };
}

export async function getDailyReports(context: DailyReportAccessContext) {
  return prisma.dailyReport.findMany({
    where: reportAccessFilter(context),
    include: {
      cropSeason: {
        include: {
          block: {
            include: {
              farm: true
            }
          }
        }
      },
      manager: true
    },
    orderBy: {
      reportDate: "desc"
    }
  });
}

export async function getDailyReportById(id: string, context: DailyReportAccessContext) {
  return prisma.dailyReport.findFirst({
    where: {
      id,
      ...reportAccessFilter(context)
    },
    include: {
      cropSeason: {
        include: {
          block: {
            include: {
              farm: true
            }
          }
        }
      },
      manager: true
    }
  });
}

export async function getAccessibleCropSeasonsForReports(context: DailyReportAccessContext) {
  return prisma.cropSeason.findMany({
    where: {
      archivedAt: null,
      ...(canAccessAllFarms(context.role)
        ? {}
        : {
            block: {
              farmId: {
                in: context.assignedFarmIds
              }
            }
          })
    },
    include: {
      block: {
        include: {
          farm: true
        }
      }
    },
    orderBy: [{ startDate: "desc" }, { cropName: "asc" }]
  });
}
