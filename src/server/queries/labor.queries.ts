import type { Role } from "@prisma/client";

import { canAccessAllFarms } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { buildLaborHistorySnapshot, buildLaborOverview } from "@/server/services/labor/labor.service";

export type LaborAccessContext = {
  role: Role;
  assignedFarmIds: string[];
};

export type LaborOverview = {
  workers: Array<{
    id: string;
    name: string;
    workerType: string;
    entityKind: string;
    employmentType: string;
    activityType: string;
    costUnit: string;
    status: string;
    dailyWage: number;
    salaryAmount: number;
    perAcreRate: number;
    startDate: string | null;
    endDate: string | null;
    teamSize: number;
    attendanceRequired: boolean;
    reportSelectable: boolean;
  }>;
  attendanceRecords: Array<{
    id: string;
    workerName: string;
    reportDate: string;
    status: string;
    wageAmount: number;
  }>;
  totals: {
    activeWorkers: number;
    attendanceCount: number;
    wageTotal: number;
    balanceTotal: number;
  };
  history: Array<{
    id: string;
    name: string;
    farmName: string;
    entityKind: string;
    employmentType: string;
    activityType: string;
    archiveReason: string;
    archivedAt: string;
  }>;
  schemaReady: boolean;
};

function farmAccessFilter(context: LaborAccessContext) {
  if (canAccessAllFarms(context.role)) {
    return {};
  }

  return {
    farmId: {
      in: context.assignedFarmIds
    }
  };
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function archiveExpiredTemporaryLabor(context: LaborAccessContext) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredWorkers = await prisma.worker.findMany({
    where: {
      ...farmAccessFilter(context),
      archivedAt: null,
      employmentType: "TEMPORARY",
      endDate: {
        lt: today
      }
    }
  });

  for (const worker of expiredWorkers) {
    const archivedAt = new Date();

    await prisma.$transaction(async (tx) => {
      const existingHistory = await tx.laborHistory.findFirst({
        where: {
          workerId: worker.id,
          archiveReason: "TEMPORARY_PERIOD_ENDED"
        },
        select: {
          id: true
        }
      });

      if (!existingHistory) {
        await tx.laborHistory.create({
          data: {
            farmId: worker.farmId,
            workerId: worker.id,
            archivedAt,
            archiveReason: "TEMPORARY_PERIOD_ENDED",
            snapshot: buildLaborHistorySnapshot(worker)
          }
        });
      }

      await tx.worker.update({
        where: {
          id: worker.id
        },
        data: {
          status: "INACTIVE",
          archivedAt,
          archiveReason: "TEMPORARY_PERIOD_ENDED"
        }
      });
    });
  }
}

export async function getLaborOverview(context: LaborAccessContext): Promise<LaborOverview> {
  await archiveExpiredTemporaryLabor(context);

  const [workers, attendanceRecords, history] = await Promise.all([
    prisma.worker.findMany({
      where: {
        ...farmAccessFilter(context),
        archivedAt: null
      },
      orderBy: [{ status: "asc" }, { name: "asc" }]
    }),
    prisma.laborAttendance.findMany({
      where: farmAccessFilter(context),
      include: {
        worker: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }]
    }),
    prisma.laborHistory.findMany({
      where: farmAccessFilter(context),
      include: {
        farm: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ archivedAt: "desc" }, { createdAt: "desc" }],
      take: 50
    })
  ]);

  const overview = buildLaborOverview({ workers, attendanceRecords });

  return {
    ...overview,
    history: history.map((entry) => {
      const snapshot = entry.snapshot as Record<string, unknown>;

      return {
        id: entry.id,
        name: String(snapshot.name ?? "Archived labour"),
        farmName: entry.farm.name,
        entityKind: String(snapshot.entityKind ?? "INDIVIDUAL"),
        employmentType: String(snapshot.employmentType ?? "TEMPORARY"),
        activityType: String(snapshot.activityType ?? "FIELD_LABOUR"),
        archiveReason: entry.archiveReason,
        archivedAt: toDateKey(entry.archivedAt)
      };
    })
  };
}

export async function getReportSelectableLabor(context: LaborAccessContext) {
  await archiveExpiredTemporaryLabor(context);

  const workers = await prisma.worker.findMany({
    where: {
      ...farmAccessFilter(context),
      archivedAt: null,
      OR: [
        {
          entityKind: "TEAM"
        },
        {
          employmentType: {
            in: ["DAILY_WAGE", "TEMPORARY"]
          }
        }
      ]
    },
    include: {
      farm: {
        select: {
          name: true
        }
      }
    },
    orderBy: [{ farm: { name: "asc" } }, { name: "asc" }]
  });

  return workers.map((worker) => ({
    id: worker.id,
    label: `${worker.name} - ${worker.farm.name}`,
    activityType: worker.activityType,
    costUnit: worker.costUnit,
    dailyWage: Number(worker.dailyWage ?? 0),
    perAcreRate: Number(worker.perAcreRate ?? 0)
  }));
}
