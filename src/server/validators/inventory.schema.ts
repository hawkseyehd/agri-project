import { z } from "zod";

export const inventoryMovementTypeSchema = z.enum(["PURCHASE", "USAGE", "ADJUSTMENT", "WASTAGE"]);

const optionalNumberString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? "0" : value),
  z
    .string()
    .trim()
    .default("0")
);

export const inventoryItemSchema = z.object({
  farmId: z.string().trim().min(1, "Farm is required."),
  name: z.string().trim().min(2, "Item name must be at least 2 characters."),
  itemType: z.string().trim().min(1, "Item type is required."),
  unit: z.string().trim().min(1, "Unit is required."),
  quantity: optionalNumberString.refine((value) => Number(value) >= 0, "Quantity cannot be negative."),
  lowStockLevel: optionalNumberString.refine((value) => Number(value) >= 0, "Low-stock level cannot be negative.")
});

export const inventoryMovementSchema = z.object({
  itemId: z.string().trim().min(1, "Inventory item is required."),
  type: inventoryMovementTypeSchema,
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required.")
    .refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  allowNegativeStock: z.boolean().default(false)
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
