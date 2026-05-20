import { describe, expect, it } from "vitest";

import { workerSchema } from "@/server/validators/worker.schema";

const baseInput = {
  farmId: "farm_1",
  name: "Ali Raza",
  phone: "",
  status: "ACTIVE"
};

describe("worker schema", () => {
  it("accepts a salary individual that requires attendance", () => {
    const result = workerSchema.safeParse({
      ...baseInput,
      entityKind: "INDIVIDUAL",
      employmentType: "SALARY",
      activityType: "FIELD_LABOUR",
      costUnit: "DAILY_WAGE",
      workerType: "Field labour",
      dailyWage: "1800",
      salaryAmount: "54000"
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      entityKind: "INDIVIDUAL",
      employmentType: "SALARY",
      activityType: "FIELD_LABOUR",
      dailyWage: 1800,
      salaryAmount: 54000
    });
  });

  it("accepts a daily-wage individual as report-selectable labour", () => {
    const result = workerSchema.safeParse({
      ...baseInput,
      entityKind: "INDIVIDUAL",
      employmentType: "DAILY_WAGE",
      activityType: "IRRIGATION",
      costUnit: "DAILY_WAGE",
      workerType: "Irrigation labour",
      dailyWage: "1600"
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      employmentType: "DAILY_WAGE",
      activityType: "IRRIGATION",
      dailyWage: 1600
    });
  });

  it("requires dates for temporary individual labour", () => {
    const result = workerSchema.safeParse({
      ...baseInput,
      entityKind: "INDIVIDUAL",
      employmentType: "TEMPORARY",
      activityType: "PLANTING",
      costUnit: "DAILY_WAGE",
      workerType: "Planting labour",
      dailyWage: "1500"
    });

    expect(result.success).toBe(false);
    expect(!result.success && result.error.flatten().fieldErrors).toMatchObject({
      startDate: ["Start date is required for temporary labour."],
      endDate: ["End date is required for temporary labour."]
    });
  });

  it("accepts a temporary team with per-acre costing", () => {
    const result = workerSchema.safeParse({
      ...baseInput,
      name: "Gud team",
      entityKind: "TEAM",
      employmentType: "TEMPORARY",
      activityType: "GUD",
      costUnit: "PER_ACRE",
      workerType: "Gud",
      perAcreRate: "4500",
      teamSize: "6",
      startDate: "2026-05-01",
      endDate: "2026-05-10"
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      entityKind: "TEAM",
      employmentType: "TEMPORARY",
      activityType: "GUD",
      costUnit: "PER_ACRE",
      perAcreRate: 4500,
      teamSize: 6
    });
  });

  it("rejects a team without a per-acre rate", () => {
    const result = workerSchema.safeParse({
      ...baseInput,
      name: "Leaf cutting team",
      entityKind: "TEAM",
      employmentType: "TEMPORARY",
      activityType: "LEAF_CUTTING",
      costUnit: "PER_ACRE",
      workerType: "Leaf cutting",
      teamSize: "5",
      startDate: "2026-05-01",
      endDate: "2026-05-10"
    });

    expect(result.success).toBe(false);
    expect(!result.success && result.error.flatten().fieldErrors).toMatchObject({
      perAcreRate: ["Team labour requires a per-acre rate."]
    });
  });
});
