import { z } from "zod";

export const laborEntityKindSchema = z.enum(["INDIVIDUAL", "TEAM"]);
export const laborEmploymentTypeSchema = z.enum(["SALARY", "DAILY_WAGE", "TEMPORARY"]);
export const laborCostUnitSchema = z.enum(["DAILY_WAGE", "MONTHLY_SALARY", "PER_ACRE"]);
export const laborActivityTypeSchema = z.enum([
  "FIELD_LABOUR",
  "IRRIGATION",
  "PLANTING",
  "HARVESTING",
  "LEAF_CUTTING",
  "LAND_WORK",
  "GUD",
  "DARR",
  "DARESHI",
  "TRACTOR_WORK",
  "SPRAYING",
  "FERTILIZER_APPLICATION",
  "WEEDING",
  "PRUNING",
  "LOADING",
  "OTHER"
]);
export const workerStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

function optionalAmount(message: string) {
  return z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number(value) >= 0, message)
    .transform((value) => (value ? Number(value) : undefined));
}

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const workerSchema = z
  .object({
    farmId: z.string().trim().min(1, "Farm is required."),
    name: z.string().trim().min(2, "Worker name must be at least 2 characters."),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    workerType: z.string().trim().min(1, "Work type is required.").default("Field labour"),
    entityKind: laborEntityKindSchema.default("INDIVIDUAL"),
    employmentType: laborEmploymentTypeSchema.default("SALARY"),
    activityType: laborActivityTypeSchema.default("FIELD_LABOUR"),
    costUnit: laborCostUnitSchema.default("DAILY_WAGE"),
    status: workerStatusSchema.default("ACTIVE"),
    dailyWage: optionalAmount("Daily wage cannot be negative."),
    salaryAmount: optionalAmount("Salary amount cannot be negative."),
    perAcreRate: optionalAmount("Per-acre rate cannot be negative."),
    teamSize: optionalAmount("Team size cannot be negative."),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema
  })
  .superRefine((value, context) => {
    if (value.entityKind === "TEAM") {
      if (value.costUnit !== "PER_ACRE") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Team labour must use per-acre costing.",
          path: ["costUnit"]
        });
      }

      if (!value.perAcreRate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Team labour requires a per-acre rate.",
          path: ["perAcreRate"]
        });
      }
    }

    if (value.entityKind === "INDIVIDUAL" && value.costUnit === "PER_ACRE") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Individual labour cannot use per-acre costing.",
        path: ["costUnit"]
      });
    }

    if (value.entityKind === "INDIVIDUAL" && value.costUnit !== "PER_ACRE" && !value.dailyWage && !value.salaryAmount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Individual labour requires a daily wage or salary amount.",
        path: ["dailyWage"]
      });
    }

    if (value.employmentType === "TEMPORARY") {
      if (!value.startDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required for temporary labour.",
          path: ["startDate"]
        });
      }

      if (!value.endDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required for temporary labour.",
          path: ["endDate"]
        });
      }
    }

    if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before start date.",
        path: ["endDate"]
      });
    }
  });

export type WorkerInput = z.infer<typeof workerSchema>;
