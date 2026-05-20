import { z } from "zod";

export const harvestSchema = z.object({
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
});

export type HarvestInput = z.infer<typeof harvestSchema>;
