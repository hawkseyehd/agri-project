import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const loginForm = readFileSync(join(process.cwd(), "src", "app", "login", "LoginForm.tsx"), "utf8");
const registerForm = readFileSync(join(process.cwd(), "src", "app", "register", "RegisterForm.tsx"), "utf8");
const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const devScript = readFileSync(join(process.cwd(), "scripts", "dev.mjs"), "utf8");

describe("auth redirects", () => {
  test("do not pin local auth redirects to port 3000", () => {
    expect(envExample).not.toContain("localhost:3000");
  });

  test("login keeps auth result navigation on the current browser origin", () => {
    expect(loginForm).toContain("toCurrentOrigin");
    expect(loginForm).toContain("window.location.origin");
  });

  test("registration keeps auth result navigation on the current browser origin", () => {
    expect(registerForm).toContain("redirect: false");
    expect(registerForm).toContain("toCurrentOrigin");
    expect(registerForm).toContain("window.location.origin");
  });

  test("dev server sets auth origin from the selected port", () => {
    expect(packageJson).toContain('"dev": "node scripts/dev.mjs"');
    expect(devScript).toContain("NEXTAUTH_URL");
    expect(devScript).toContain("AUTH_URL");
    expect(devScript).toContain("localhost:${port}");
  });
});
