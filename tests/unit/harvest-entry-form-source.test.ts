import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = join(process.cwd(), "src", "app", "harvest-sales", "page.tsx");
const formPath = join(process.cwd(), "src", "app", "harvest-sales", "HarvestEntryForm.tsx");
const page = readFileSync(pagePath, "utf8");
const form = existsSync(formPath) ? readFileSync(formPath, "utf8") : "";

describe("harvest entry form", () => {
  it("uses one harvest form with optional sales fields", () => {
    expect(page).toContain("<HarvestEntryForm");
    expect(page).not.toContain('<Panel title="Record Sale">');
    expect(form).toContain("Add sales data");
    expect(form).toContain('name="includeSale"');
    expect(form).toContain('name="buyerName"');
    expect(form).toContain('name="saleQuantity"');
  });

  it("warns before an early harvest and allows explicit confirmation", () => {
    expect(form).toContain("selectedCropSeasonId");
    expect(form).toContain("expectedHarvestDate");
    expect(form).toContain("This harvest is earlier than the expected harvest date.");
    expect(form).toContain("Continue with early harvest");
    expect(form).toContain('name="allowEarlyHarvest"');
  });
});
