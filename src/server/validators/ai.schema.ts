import { z } from "zod";

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const dailyReportAiSchema = z.object({
  cropSeasonId: optionalIdSchema,
  notes: z.string().trim().min(8, "Add a few rough notes before asking AI to structure the report.").max(4000, "Notes must stay under 4,000 characters.")
});

export const receiptExtractionAiSchema = z
  .object({
    farmId: z.string().trim().min(1, "Select a farm before extracting expense details."),
    receiptText: z.string().trim().max(4000, "Receipt text must stay under 4,000 characters.").optional(),
    fileName: z.string().trim().max(180, "File name is too long.").optional()
  })
  .refine((value) => Boolean(value.receiptText || value.fileName), {
    message: "Add receipt text or a file name before extracting fields.",
    path: ["receiptText"]
  });

export type DailyReportAiInput = z.infer<typeof dailyReportAiSchema>;
export type ReceiptExtractionAiInput = z.infer<typeof receiptExtractionAiSchema>;
