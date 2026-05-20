import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const globalsCss = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

describe("theme CSS", () => {
  test("defines dark theme tokens for the document dark class", () => {
    expect(globalsCss).toContain(".dark {");
    expect(globalsCss).toMatch(/--background:\s*150 24% 8%;/);
    expect(globalsCss).toMatch(/--foreground:\s*150 20% 94%;/);
    expect(globalsCss).toMatch(/--border:\s*150 14% 22%;/);
    expect(globalsCss).toMatch(/--muted:\s*150 16% 14%;/);
  });

  test("overrides common light utility classes only inside dark mode", () => {
    expect(globalsCss).toContain(".dark .bg-white");
    expect(globalsCss).toContain(".dark .text-slate-950");
    expect(globalsCss).toContain(".dark .border-slate-200");
    expect(globalsCss).toContain(".dark input");
    expect(globalsCss).toContain(".dark select");
    expect(globalsCss).toContain(".dark textarea");
  });
});
