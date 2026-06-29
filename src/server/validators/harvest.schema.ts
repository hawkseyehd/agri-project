import { z } from "zod";

const harvestFields = {
  cropSeasonId: z.string().trim().min(1, "Crop season is required."),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required.")
    .refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
  unit: z.string().trim().min(1, "Unit is required."),
  harvestDate: z
    .string()
    .trim()
    .min(1, "Harvest date is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Harvest date must be valid."),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
};

export const harvestSchema = z.object(harvestFields);

export const harvestEntrySchema = z
  .discriminatedUnion("includeSale", [
    z.object({
      ...harvestFields,
      includeSale: z.literal("false"),
      allowEarlyHarvest: z.enum(["true", "false"]).default("false")
    }),
    z.object({
      ...harvestFields,
      includeSale: z.literal("true"),
      allowEarlyHarvest: z.enum(["true", "false"]).default("false"),
      buyerName: z.string().trim().min(2, "Buyer name must be at least 2 characters."),
      saleDate: z
        .string()
        .trim()
        .min(1, "Sale date is required.")
        .refine((value) => !Number.isNaN(new Date(value).getTime()), "Sale date must be valid."),
      saleQuantity: z
        .string()
        .trim()
        .min(1, "Quantity sold is required.")
        .refine((value) => Number(value) > 0, "Quantity sold must be greater than zero."),
      unitPrice: z
        .string()
        .trim()
        .min(1, "Unit price is required.")
        .refine((value) => Number(value) >= 0, "Unit price cannot be negative."),
      received: z
        .string()
        .trim()
        .default("0")
        .refine((value) => Number(value) >= 0, "Received amount cannot be negative.")
    })
  ])
  .superRefine((value, context) => {
    if (value.includeSale !== "true") {
      return;
    }

    if (Number(value.received) > Number(value.saleQuantity) * Number(value.unitPrice)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Received amount cannot exceed gross sale amount.",
        path: ["received"]
      });
    }
  });

export type HarvestInput = z.infer<typeof harvestSchema>;
export type HarvestEntryInput = z.infer<typeof harvestEntrySchema>;
