import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const appShell = readFileSync(join(process.cwd(), "src", "components", "layout", "AppShell.tsx"), "utf8");
const publicLayout = readFileSync(join(process.cwd(), "src", "components", "layout", "PublicLayout.tsx"), "utf8");

describe("theme toggle placement", () => {
  test("mounts the theme toggle in the authenticated app shell", () => {
    expect(appShell).toContain('import { ThemeToggle } from "@/components/ui/ThemeToggle";');
    expect(appShell).toContain("<ThemeToggle />");
  });

  test("mounts the theme toggle in the public header", () => {
    expect(publicLayout).toContain('import { ThemeToggle } from "@/components/ui/ThemeToggle";');
    expect(publicLayout).toContain("<ThemeToggle />");
  });
});
