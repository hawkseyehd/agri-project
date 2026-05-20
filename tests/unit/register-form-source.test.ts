import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const registerForm = readFileSync(join(process.cwd(), "src", "app", "register", "RegisterForm.tsx"), "utf8");

describe("register form source", () => {
  test("signs in the registered user and continues to setup", () => {
    expect(registerForm).toContain('import { signIn } from "next-auth/react";');
    expect(registerForm).toContain('signIn("credentials"');
    expect(registerForm).toContain('callbackUrl: "/setup-farm"');
  });
});
