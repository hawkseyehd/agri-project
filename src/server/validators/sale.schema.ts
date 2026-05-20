import { z } from "zod";

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const saleSchema = z
  .object({
    cropSeasonId: z.string().trim().min(1, "Crop season is required."),
    harvestId: optionalIdSchema,
    buyerName: z.string().trim().min(2, "Buyer name must be at least 2 characters."),
    quantity: z
      .string()
      .trim()
      .min(1, "Quantity is required.")
      .refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
    unitPrice: z
      .string()
      .trim()
      .min(1, "Unit price is required.")
      .refine((value) => Number(value) >= 0, "Unit price cannot be negative."),
    saleDate: z
      .string()
      .trim()
      .min(1, "Sale date is required.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Sale date must be valid."),
    received: z
      .string()
      .trim()
      .default("0")
      .refine((value) => Number(value) >= 0, "Received amount cannot be negative.")
  })
  .superRefine((value, context) => {
    const grossAmount = Number(value.quantity) * Number(value.unitPrice);
    const received = Number(value.received);

    if (received > grossAmount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Received amount cannot exceed gross sale amount.",
        path: ["received"]
      });
    }
  });

export type SaleInput = z.infer<typeof saleSchema>;
