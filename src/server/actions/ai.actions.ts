"use server";

import { requireAuthUser } from "@/server/auth/auth";
import { assertCanUsePageAction } from "@/server/auth/page-permissions";
import { assertCanAccessFarm, canAccessFarm } from "@/server/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { extractReceiptFields, structureDailyReportNotes, type DailyReportSuggestion, type ReceiptExtractionFields } from "@/server/services/ai";
import { dailyReportAiSchema, receiptExtractionAiSchema } from "@/server/validators/ai.schema";

export type DailyReportAiActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  suggestions?: DailyReportSuggestion;
  reviewReminder?: string;
};

export type ReceiptAiActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  fields?: ReceiptExtractionFields;
  confidenceNotes?: string[];
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function assertCropSeasonAccess(cropSeasonId: string | undefined) {
  if (!cropSeasonId) {
    return;
  }

  const user = await requireAuthUser();
  const season = await prisma.cropSeason.findUnique({
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

  if (!season) {
    throw new Error("Selected crop season was not found.");
  }

  assertCanAccessFarm(user.role, user.assignedFarmIds, season.block.farmId);
}

export async function structureDailyReportNotesAction(
  _previousState: DailyReportAiActionState,
  formData: FormData
): Promise<DailyReportAiActionState> {
  const parsed = dailyReportAiSchema.safeParse({
    cropSeasonId: formValue(formData, "cropSeasonId"),
    notes: formValue(formData, "notes")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please add rough notes before generating suggestions.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const user = await requireAuthUser();
    assertCanUsePageAction(user, "DAILY_REPORTS", "create");
    await assertCropSeasonAccess(parsed.data.cropSeasonId);

    const result = await structureDailyReportNotes({ notes: parsed.data.notes });

    return {
      ok: true,
      message: "AI suggestions generated. Review before copying anything into the report.",
      suggestions: result.suggestions,
      reviewReminder: result.reviewReminder
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Daily report suggestions could not be generated."
    };
  }
}

export async function extractReceiptFieldsAction(_previousState: ReceiptAiActionState, formData: FormData): Promise<ReceiptAiActionState> {
  const parsed = receiptExtractionAiSchema.safeParse({
    farmId: formValue(formData, "farmId"),
    receiptText: formValue(formData, "receiptText"),
    fileName: formValue(formData, "fileName")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please select a farm and add receipt text or a file name.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const user = await requireAuthUser();
    assertCanUsePageAction(user, "EXPENSES", "create");

    if (!canAccessFarm(user.role, user.assignedFarmIds, parsed.data.farmId)) {
      throw new Error("You do not have access to this farm.");
    }

    const result = await extractReceiptFields({
      text: parsed.data.receiptText,
      fileName: parsed.data.fileName
    });

    return {
      ok: true,
      message: "Receipt fields extracted as a draft. Verify before saving the expense.",
      fields: result.fields,
      confidenceNotes: result.confidenceNotes
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Receipt fields could not be extracted."
    };
  }
}
