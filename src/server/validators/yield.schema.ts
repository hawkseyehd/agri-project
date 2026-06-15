import { z } from "zod";

export const yieldFilterSchema = z.object({
  from: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? new Date(`${value}T00:00:00`) : undefined))
    .refine((value) => !value || !Number.isNaN(value.getTime()), "From date must be valid."),
  to: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const date = new Date(`${value}T23:59:59.999`);
      return date;
    })
    .refine((value) => !value || !Number.isNaN(value.getTime()), "To date must be valid."),
  cropName: z.string().trim().optional(),
  district: z.string().trim().optional(),
  city: z.string().trim().optional(),
  ownerId: z.string().trim().optional(),
  farmId: z.string().trim().optional()
});

export type YieldFilters = z.infer<typeof yieldFilterSchema>;
