import { describe, expect, it } from "vitest";

import { managerUserSchema, settingsCategorySchema, settingsDefaultsSchema } from "@/server/validators/settings/settings.schema";

describe("settings validators", () => {
  it("normalizes manager creation input and farm assignments", () => {
    const parsed = managerUserSchema.parse({
      name: "  Farm Manager  ",
      email: " MANAGER@EXAMPLE.COM ",
      password: "ChangeMe123!",
      farmIds: ["farm-1", "farm-2"]
    });

    expect(parsed).toEqual({
      name: "Farm Manager",
      email: "manager@example.com",
      password: "ChangeMe123!",
      farmIds: ["farm-1", "farm-2"]
    });
  });

  it("requires at least one farm assignment for managers", () => {
    const parsed = managerUserSchema.safeParse({
      name: "Farm Manager",
      email: "manager@example.com",
      password: "ChangeMe123!",
      farmIds: []
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.farmIds?.[0]).toBe("Assign the manager to at least one farm.");
    }
  });

  it("normalizes category and unit labels", () => {
    expect(settingsCategorySchema.parse({ name: "  Fertilizer  " })).toEqual({ name: "Fertilizer" });
    expect(settingsDefaultsSchema.parse({ currency: "PKR", dateFormat: "DD MMM YYYY", areaUnit: "Acres", weightUnit: "Maund" })).toEqual({
      currency: "PKR",
      dateFormat: "DD MMM YYYY",
      areaUnit: "Acres",
      weightUnit: "Maund"
    });
  });
});
