import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentPath = join(process.cwd(), "src", "components", "ui", "ArchiveActionButton.tsx");
const component = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
const harvestPage = readFileSync(join(process.cwd(), "src", "app", "harvest-sales", "page.tsx"), "utf8");
const cropPage = readFileSync(join(process.cwd(), "src", "app", "crop-seasons", "page.tsx"), "utf8");

describe("archive action UI", () => {
  it("uses a reusable confirmation control in all affected lists", () => {
    expect(component).toContain("ArchiveActionButton");
    expect(component).toContain("Archive this record?");
    expect(component).toContain("Archive");
    expect(harvestPage).toContain("archiveHarvestAction.bind(null, harvest.id)");
    expect(harvestPage).toContain("archiveSaleAction.bind(null, sale.id)");
    expect(cropPage).toContain("archiveCropSeasonAction.bind(null, season.id)");
  });
});
