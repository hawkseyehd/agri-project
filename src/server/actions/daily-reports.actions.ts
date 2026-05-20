"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, getSessionUser as getAuthenticatedSessionUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { createDailyReport, updateDailyReport } from "@/server/services/daily-report.service";
import { dailyReportSchema } from "@/server/validators/daily-report.schema";

export type DailyReportActionState = {
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
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    throw new Error("You must be signed in to manage daily reports.");
  }

  return {
    id: user.id,
    role: user.role,
    assignedFarmIds: user.assignedFarmIds ?? []
  };
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseDailyReportForm(formData: FormData) {
  return dailyReportSchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    reportDate: formValue(formData, "reportDate"),
    status: formValue(formData, "status") || "DRAFT",
    activities: formValue(formData, "activities"),
    labor: formValue(formData, "labor"),
    expenses: formValue(formData, "expenses"),
    inventoryUsage: formValue(formData, "inventoryUsage"),
    irrigation: formValue(formData, "irrigation"),
    inputApplications: formValue(formData, "inputApplications"),
    issues: formValue(formData, "issues"),
    photos: formValue(formData, "photos"),
    tomorrowPlan: formValue(formData, "tomorrowPlan"),
    notes: formValue(formData, "notes")
  });
}

export async function createDailyReportAction(
  _previousState: DailyReportActionState,
  formData: FormData
): Promise<DailyReportActionState> {
  const parsed = parseDailyReportForm(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted daily report fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  let reportId: string;

  try {
    const user = await getSessionUser();
    const sessionUser = getAuthenticatedSessionUser(await auth());
    if (sessionUser) {
      assertCanUsePageAction(sessionUser, "DAILY_REPORTS", "create");
    }
    const report = await createDailyReport(parsed.data, user);
    reportId = report.id;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Daily report could not be saved."
    };
  }

  revalidatePath("/daily-reports");
  redirect(`/daily-reports/${reportId}`);
}

export async function updateDailyReportAction(
  id: string,
  _previousState: DailyReportActionState,
  formData: FormData
): Promise<DailyReportActionState> {
  const parsed = parseDailyReportForm(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted daily report fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const user = await getSessionUser();
    const sessionUser = getAuthenticatedSessionUser(await auth());
    if (sessionUser) {
      assertCanUsePageAction(sessionUser, "DAILY_REPORTS", "edit");
    }
    await updateDailyReport(id, parsed.data, user);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Daily report could not be updated."
    };
  }

  revalidatePath("/daily-reports");
  revalidatePath(`/daily-reports/${id}`);
  redirect(`/daily-reports/${id}`);
}
