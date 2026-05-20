"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { canAccessFarm } from "@/server/auth/permissions";
import { auth, getSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { prisma } from "@/server/db/prisma";
import { buildLaborHistorySnapshot } from "@/server/services/labor/labor.service";
import { workerSchema } from "@/server/validators/worker.schema";

type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

type SessionUser = {
  role?: Role;
  assignedFarmIds?: string[];
};

async function requireFarmAccess(farmId: string, action: "create" | "edit" | "delete") {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const sessionUser = getSessionUser(session);

  if (!user?.role || !canAccessFarm(user.role, user.assignedFarmIds ?? [], farmId)) {
    throw new Error("You do not have access to this farm.");
  }

  if (sessionUser) {
    assertCanUsePageAction(sessionUser, "LABOR", action);
  }
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseWorkerForm(formData: FormData) {
  return workerSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
    workerType: formValue(formData, "workerType") || "Field labour",
    entityKind: formValue(formData, "entityKind") || "INDIVIDUAL",
    employmentType: formValue(formData, "employmentType") || "SALARY",
    activityType: formValue(formData, "activityType") || "FIELD_LABOUR",
    costUnit: formValue(formData, "costUnit") || "DAILY_WAGE",
    status: formValue(formData, "status") || "ACTIVE",
    dailyWage: formValue(formData, "dailyWage"),
    salaryAmount: formValue(formData, "salaryAmount"),
    perAcreRate: formValue(formData, "perAcreRate"),
    teamSize: formValue(formData, "teamSize"),
    startDate: formValue(formData, "startDate"),
    endDate: formValue(formData, "endDate")
  });
}

function toDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function createWorkerAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseWorkerForm(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted worker fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await requireFarmAccess(parsed.data.farmId, "create");
    await prisma.worker.create({
      data: {
        farmId: parsed.data.farmId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        workerType: parsed.data.workerType,
        entityKind: parsed.data.entityKind,
        employmentType: parsed.data.employmentType,
        activityType: parsed.data.activityType,
        costUnit: parsed.data.costUnit,
        status: parsed.data.status,
        dailyWage: parsed.data.dailyWage ?? 0,
        salaryAmount: parsed.data.salaryAmount,
        perAcreRate: parsed.data.perAcreRate,
        teamSize: parsed.data.teamSize ? Math.trunc(parsed.data.teamSize) : null,
        startDate: toDate(parsed.data.startDate),
        endDate: toDate(parsed.data.endDate)
      }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Worker could not be created."
    };
  }

  revalidatePath("/labor");
  return { ok: true, message: "Worker created." };
}

export async function createWorkerFormAction(formData: FormData) {
  await createWorkerAction({ ok: false }, formData);
}

export async function updateWorkerAction(_id: string, _previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseWorkerForm(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted worker fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await requireFarmAccess(parsed.data.farmId, "edit");
    await prisma.worker.update({
      where: {
        id: _id
      },
      data: {
        farmId: parsed.data.farmId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        workerType: parsed.data.workerType,
        entityKind: parsed.data.entityKind,
        employmentType: parsed.data.employmentType,
        activityType: parsed.data.activityType,
        costUnit: parsed.data.costUnit,
        status: parsed.data.status,
        dailyWage: parsed.data.dailyWage ?? 0,
        salaryAmount: parsed.data.salaryAmount,
        perAcreRate: parsed.data.perAcreRate,
        teamSize: parsed.data.teamSize ? Math.trunc(parsed.data.teamSize) : null,
        startDate: toDate(parsed.data.startDate),
        endDate: toDate(parsed.data.endDate)
      }
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Worker could not be updated."
    };
  }

  revalidatePath("/labor");
  return { ok: true, message: "Worker updated." };
}

export async function archiveWorkerAction(id: string): Promise<ActionState> {
  try {
    const worker = await prisma.worker.findUnique({
      where: {
        id
      }
    });

    if (!worker) {
      throw new Error("Worker or team was not found.");
    }

    await requireFarmAccess(worker.farmId, "delete");

    const archivedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.laborHistory.create({
        data: {
          farmId: worker.farmId,
          workerId: worker.id,
          archivedAt,
          archiveReason: "MANUAL_ARCHIVE",
          snapshot: buildLaborHistorySnapshot(worker)
        }
      });

      await tx.worker.update({
        where: {
          id: worker.id
        },
        data: {
          status: "INACTIVE",
          archivedAt,
          archiveReason: "MANUAL_ARCHIVE"
        }
      });
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Worker or team could not be archived."
    };
  }

  revalidatePath("/labor");
  return { ok: true, message: "Moved to labour history." };
}

export async function archiveWorkerFormAction(id: string) {
  await archiveWorkerAction(id);
}
