import { z } from "zod";

export const paymentStatusSchema = z.enum(["PENDING", "PARTIAL", "PAID"]);

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const expenseSchema = z.object({
  farmId: z.string().trim().min(1, "Farm is required."),
  blockId: optionalIdSchema,
  cropSeasonId: optionalIdSchema,
  category: z.string().trim().min(2, "Category must be at least 2 characters."),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  paymentStatus: paymentStatusSchema.default("PENDING"),
  receiptPath: optionalIdSchema,
  expenseDate: z
    .string()
    .trim()
    .min(1, "Expense date is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Expense date must be valid.")
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
