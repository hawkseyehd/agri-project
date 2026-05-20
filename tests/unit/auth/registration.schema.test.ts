import { describe, expect, it } from "vitest";

import { registrationSchema } from "../../../src/server/validators/auth.schema";

describe("registrationSchema", () => {
  it("normalizes email and accepts valid registration data", () => {
    const parsed = registrationSchema.parse({
      name: "New Land Owner",
      email: "  Owner@Example.COM ",
      password: "ChangeMe123!",
      confirmPassword: "ChangeMe123!"
    });

    expect(parsed.email).toBe("owner@example.com");
  });

  it("rejects mismatched passwords", () => {
    const parsed = registrationSchema.safeParse({
      name: "New Land Owner",
      email: "owner@example.com",
      password: "ChangeMe123!",
      confirmPassword: "Different123!"
    });

    expect(parsed.success).toBe(false);
  });
});
