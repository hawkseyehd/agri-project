import { z } from "zod";

const farmTypeSchema = z
  .string()
  .trim()
  .min(1, "Farm type is required.")
  .pipe(z.enum(["OWNER", "CONTRACTOR", "LEASE"]));

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const requiredNumber = (requiredMessage: string, invalidMessage: string, positiveMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .transform((value) => Number(value))
    .refine((value) => !Number.isNaN(value), invalidMessage)
    .refine((value) => value > 0, positiveMessage);

const optionalNumber = (invalidMessage: string, negativeMessage: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || !Number.isNaN(value), invalidMessage)
    .refine((value) => value === undefined || value >= 0, negativeMessage);

const optionalInteger = (invalidMessage: string, negativeMessage: string) =>
  optionalNumber(invalidMessage, negativeMessage).refine((value) => value === undefined || Number.isInteger(value), invalidMessage);

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : undefined))
  .refine((value) => value === undefined || !Number.isNaN(value.getTime()), "Date must be valid.");

const optionalBoundaryGeoJson = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Map boundary must be valid GeoJSON."
      });
      return z.NEVER;
    }
  })
  .refine((value) => value === undefined || (value?.type === "Feature" && value.geometry?.type === "Polygon"), "Map boundary must be a polygon.");

export const farmSchema = z.object({
  name: z.string().trim().min(2, "Farm name must be at least 2 characters."),
  address: z.string().trim().min(1, "Address is required."),
  area: requiredNumber("Area is required.", "Area must be a number.", "Area must be greater than zero."),
  type: farmTypeSchema,
  location: optionalText,
  farmCode: optionalText,
  village: optionalText,
  city: optionalText,
  district: optionalText,
  region: optionalText,
  country: optionalText,
  gpsCoordinates: optionalText,
  boundaryGeoJson: optionalBoundaryGeoJson,
  registrationNumber: optionalText,
  landRecordNumber: optionalText,
  leaseStartDate: optionalDate,
  leaseEndDate: optionalDate,
  contactPerson: optionalText,
  contactPhone: optionalText,
  description: optionalText,
  soilType: optionalText,
  soilPh: optionalNumber("Soil pH must be a number.", "Soil pH cannot be negative."),
  organicMatterLevel: optionalText,
  salinityIssue: optionalText,
  lastSoilTestDate: optionalDate,
  fertilityNotes: optionalText,
  knownProblems: optionalText,
  irrigationMethod: optionalText,
  waterSource: optionalText,
  waterSourcesCount: optionalInteger("Water sources count must be a whole number.", "Water sources count cannot be negative."),
  pumpType: optionalText,
  waterAvailability: optionalText,
  irrigationEnergySource: optionalText,
  waterScheduleNotes: optionalText,
  permanentWorkersCount: optionalInteger("Permanent workers count must be a whole number.", "Permanent workers count cannot be negative."),
  seasonalWorkersCount: optionalInteger("Seasonal workers count must be a whole number.", "Seasonal workers count cannot be negative."),
  defaultDailyWage: optionalNumber("Default daily wage must be a number.", "Default daily wage cannot be negative."),
  inventoryNotes: optionalText,
  equipmentNotes: optionalText,
  openingBalance: optionalNumber("Opening balance must be a number.", "Opening balance cannot be negative."),
  currency: optionalText,
  seasonalBudget: optionalNumber("Seasonal budget must be a number.", "Seasonal budget cannot be negative."),
  expenseCategories: optionalText,
  documentsNotes: optionalText,
  alertsNotes: optionalText,
  managerNotes: optionalText
});

export const farmWithInitialBlockSchema = farmSchema
  .extend({
    initialBlockName: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    initialBlockAreaAcres: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .refine((value) => value === undefined || !Number.isNaN(value), "Block area must be a number.")
      .refine((value) => value === undefined || value >= 0, "Block area cannot be negative."),
    initialBlockBoundaryGeoJson: optionalBoundaryGeoJson
  })
  .superRefine((value, context) => {
    if (value.initialBlockAreaAcres !== undefined && !value.initialBlockName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initialBlockName"],
        message: "Block name is required when block area is set."
      });
    }
  });

export const landBlockSchema = z.object({
  farmId: z.string().trim().min(1, "Farm is required."),
  name: z.string().trim().min(1, "Block name is required."),
  areaAcres: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || !Number.isNaN(value), "Area must be a number.")
    .refine((value) => value === undefined || value >= 0, "Area cannot be negative."),
  boundaryGeoJson: optionalBoundaryGeoJson
});

export type FarmInput = z.infer<typeof farmSchema>;
export type FarmWithInitialBlockInput = z.infer<typeof farmWithInitialBlockSchema>;
export type LandBlockInput = z.infer<typeof landBlockSchema>;
