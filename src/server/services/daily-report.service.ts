import type { Role } from "@prisma/client";

import { canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import type { DailyReportInput } from "@/server/validators/daily-report.schema";

export type DailyReportUserContext = {
  id: string;
  role: Role;
  assignedFarmIds: string[];
};

const sectionLabels: Array<[keyof DailyReportInput, string]> = [
  ["activities", "Activities"],
  ["labor", "Labor"],
  ["expenses", "Expenses"],
  ["inventoryUsage", "Inventory usage"],
  ["irrigation", "Irrigation"],
  ["inputApplications", "Input applications"],
  ["issues", "Issues"],
  ["photos", "Photos"],
  ["tomorrowPlan", "Tomorrow plan"],
  ["notes", "General notes"]
];

function toDate(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function composeNotes(input: DailyReportInput) {
  return sectionLabels
    .map(([key, label]) => {
      const value = input[key];
      return typeof value === "string" && value.length > 0 ? `${label}:\n${value}` : undefined;
    })
    .filter(Boolean)
    .join("\n\n");
}

async function assertCropSeasonAccess(cropSeasonId: string, user: DailyReportUserContext) {
  const cropSeason = await prisma.cropSeason.findUnique({
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

  if (!cropSeason) {
    throw new Error("Selected crop season was not found.");
  }

  if (!canAccessFarm(user.role, user.assignedFarmIds, cropSeason.block.farmId)) {
    throw new Error("You do not have access to this crop season.");
  }
}

export async function createDailyReport(input: DailyReportInput, user: DailyReportUserContext) {
  await assertCropSeasonAccess(input.cropSeasonId, user);

  return prisma.dailyReport.create({
    data: {
      cropSeasonId: input.cropSeasonId,
      managerId: user.id,
      reportDate: toDate(input.reportDate),
      notes: composeNotes(input) || null,
      submittedAt: input.status === "SUBMITTED" ? new Date() : null
    }
  });
}

export async function updateDailyReport(id: string, input: DailyReportInput, user: DailyReportUserContext) {
  await assertCropSeasonAccess(input.cropSeasonId, user);

  const existingReport = await prisma.dailyReport.findFirst({
    where: {
      id,
      cropSeasonId: input.cropSeasonId
    },
    select: {
      id: true
    }
  });

  if (!existingReport) {
    throw new Error("Daily report was not found for the selected crop season.");
  }

  return prisma.dailyReport.update({
    where: {
      id
    },
    data: {
      reportDate: toDate(input.reportDate),
      notes: composeNotes(input) || null,
      submittedAt: input.status === "SUBMITTED" ? new Date() : null
    }
  });
}
