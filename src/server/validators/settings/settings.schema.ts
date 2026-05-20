import { z } from "zod";

const farmIdsSchema = z
  .array(z.string().trim().min(1))
  .min(1, "Assign the manager to at least one farm.")
  .transform((ids) => Array.from(new Set(ids)));

export const managerUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  farmIds: farmIdsSchema
});

export const managerFarmAssignmentSchema = z.object({
  managerId: z.string().trim().min(1, "Manager is required."),
  farmIds: farmIdsSchema
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.")
});

export const companyNameSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters.")
});

export const ownedFarmNameSchema = z.object({
  farmId: z.string().trim().min(1, "Farm is required."),
  farmName: z.string().trim().min(2, "Farm name must be at least 2 characters.")
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm the new password.")
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

export const notificationPreferenceSchema = z.object({
  dailyReportReminder: z.boolean(),
  lowStockAlert: z.boolean(),
  irrigationReminder: z.boolean(),
  paymentDueReminder: z.boolean(),
  weatherAlerts: z.boolean()
});

export const settingsCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.")
});

export const settingsDefaultsSchema = z.object({
  currency: z.string().trim().min(1, "Currency is required."),
  dateFormat: z.string().trim().min(1, "Date format is required."),
  areaUnit: z.string().trim().min(1, "Area unit is required."),
  weightUnit: z.string().trim().min(1, "Weight unit is required.")
});

export type ManagerUserInput = z.infer<typeof managerUserSchema>;
export type ManagerFarmAssignmentInput = z.infer<typeof managerFarmAssignmentSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CompanyNameInput = z.infer<typeof companyNameSchema>;
export type OwnedFarmNameInput = z.infer<typeof ownedFarmNameSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type SettingsCategoryInput = z.infer<typeof settingsCategorySchema>;
export type SettingsDefaultsInput = z.infer<typeof settingsDefaultsSchema>;
