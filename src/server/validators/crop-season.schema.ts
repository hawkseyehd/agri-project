import { z } from "zod";

export const cropSeasonStatusSchema = z.enum(["PLANNED", "ACTIVE", "HARVESTED", "CLOSED"]);
export const cropTypeSchema = z.enum(["CROP", "TREE", "PLANTAIN", "RATOON"]);

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const cropSeasonSchema = z
  .object({
    blockId: z.string().trim().min(1, "Land block is required."),
    cropType: cropTypeSchema.default("CROP"),
    cropName: z.string().trim().min(2, "Crop name must be at least 2 characters."),
    variety: optionalTextSchema,
    startDate: z.string().trim().min(1, "Sowing date is required."),
    endDate: optionalDateSchema,
    harvestTiming: optionalTextSchema,
    status: cropSeasonStatusSchema.default("PLANNED")
  })
  .superRefine((value, context) => {
    const start = new Date(value.startDate);
    const end = value.endDate ? new Date(value.endDate) : undefined;
    const isSeasonalCrop = value.cropType === "CROP";
    const isTree = value.cropType === "TREE";

    if (Number.isNaN(start.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${isSeasonalCrop ? "Sowing" : "Planting"} date must be a valid date.`,
        path: ["startDate"]
      });
    }

    if (isSeasonalCrop && !value.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected harvest is required for seasonal crops.",
        path: ["endDate"]
      });
    }

    if (!isSeasonalCrop && value.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Harvest date is only used for seasonal crops.",
        path: ["endDate"]
      });
    }

    if (isTree && !value.harvestTiming) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Approximate yearly harvest time is required for trees.",
        path: ["harvestTiming"]
      });
    }

    if (!isTree && value.harvestTiming) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Approximate yearly harvest time is only used for trees.",
        path: ["harvestTiming"]
      });
    }

    if (end && Number.isNaN(end.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected harvest must be a valid date.",
        path: ["endDate"]
      });
    }

    if (isSeasonalCrop && end && !Number.isNaN(start.getTime()) && end < start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected harvest cannot be before sowing date.",
        path: ["endDate"]
      });
    }
  });

export type CropSeasonInput = z.infer<typeof cropSeasonSchema>;
