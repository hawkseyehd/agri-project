import { z } from "zod";

export const planRequestSchema = z.object({
  packageTier: z.enum(["SILVER", "GOLD", "PLATINUM"], {
    required_error: "Choose a package."
  })
});

export const firstFarmSetupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters.")
});

export type PlanRequestInput = z.infer<typeof planRequestSchema>;
export type FirstFarmSetupInput = z.infer<typeof firstFarmSetupSchema>;
