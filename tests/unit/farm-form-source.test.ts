import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const farmForm = readFileSync(join(process.cwd(), "src", "app", "farms", "_components", "FarmForm.tsx"), "utf8");
const newFarmPage = readFileSync(join(process.cwd(), "src", "app", "farms", "new", "page.tsx"), "utf8");

describe("farm form layout", () => {
  it("shows one farm boundary map and keeps advanced information collapsed", () => {
    expect(farmForm.match(/<BoundaryDrawMap/g)).toHaveLength(1);
    expect(farmForm).toContain("Add advanced information");
    expect(farmForm).not.toContain("initialBlockBoundaryGeoJson");
    expect(newFarmPage).not.toContain("showInitialBlockFields");
  });

  it("keeps the requested basic farm fields visible before advanced information", () => {
    const basicSection = farmForm.slice(0, farmForm.indexOf("<details"));

    for (const field of ["name", "type", "address", "area", "farmCode", "location"]) {
      expect(basicSection).toContain(`name=\"${field}\"`);
    }
  });
});
