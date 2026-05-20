import { describe, expect, it } from "vitest";

import { firstFarmSetupSchema, planRequestSchema } from "@/server/validators/onboarding.schema";

describe("onboarding schemas", () => {
  it("accepts a package request for paid tiers", () => {
    expect(planRequestSchema.parse({ packageTier: "GOLD" })).toEqual({ packageTier: "GOLD" });
  });

  it("rejects a no-plan package request", () => {
    expect(planRequestSchema.safeParse({ packageTier: "NONE" }).success).toBe(false);
  });

  it("accepts company name without a first farm name", () => {
    expect(
      firstFarmSetupSchema.parse({
        companyName: "Hawkseye Farms"
      })
    ).toEqual({
      companyName: "Hawkseye Farms"
    });
  });

  it("requires a meaningful company name", () => {
    const result = firstFarmSetupSchema.safeParse({
      companyName: "A"
    });

    expect(result.success).toBe(false);
  });
});
