import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cropsPage = readFileSync(join(process.cwd(), "src", "app", "crop-seasons", "page.tsx"), "utf8");
const harvestPage = readFileSync(join(process.cwd(), "src", "app", "harvest-sales", "page.tsx"), "utf8");

describe("crop season harvest action", () => {
  it("links each crop row to a preselected harvest form", () => {
    expect(cropsPage).toContain('columns={["Crop", "Type", "Farm / Block", "Stage", "Start", "Harvest", "Actual Yield", "Expenses", "Actions"]}');
    expect(cropsPage).toContain('href={`/harvest-sales?cropSeasonId=${season.id}`}');
    expect(harvestPage).toContain("cropSeasonId?: string");
    expect(harvestPage).toContain("selectedCropSeasonId={selectedSeason?.id}");
  });
});
