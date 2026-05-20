import { z } from "zod";

export const dailyReportStatusSchema = z.enum(["DRAFT", "SUBMITTED"]);

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const dailyReportSchema = z
  .object({
    cropSeasonId: z.string().trim().min(1, "Crop season is required."),
    reportDate: z.string().trim().min(1, "Report date is required."),
    status: dailyReportStatusSchema.default("DRAFT"),
    activities: optionalTextSchema,
    labor: optionalTextSchema,
    expenses: optionalTextSchema,
    inventoryUsage: optionalTextSchema,
    irrigation: optionalTextSchema,
    inputApplications: optionalTextSchema,
    issues: optionalTextSchema,
    photos: optionalTextSchema,
    tomorrowPlan: optionalTextSchema,
    notes: optionalTextSchema
  })
  .superRefine((value, context) => {
    const reportDate = new Date(value.reportDate);

    if (Number.isNaN(reportDate.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Report date must be a valid date.",
        path: ["reportDate"]
      });
    }

    const hasReportDetails = [
      value.activities,
      value.labor,
      value.expenses,
      value.inventoryUsage,
      value.irrigation,
      value.inputApplications,
      value.issues,
      value.photos,
      value.tomorrowPlan,
      value.notes
    ].some(Boolean);

    if (value.status === "SUBMITTED" && !hasReportDetails) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one report detail before final submit.",
        path: ["notes"]
      });
    }
  });

export type DailyReportInput = z.infer<typeof dailyReportSchema>;
export type DailyReportStatus = z.infer<typeof dailyReportStatusSchema>;
