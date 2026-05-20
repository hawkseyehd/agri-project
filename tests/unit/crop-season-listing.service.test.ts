import { describe, expect, it } from "vitest";

import {
  filterCropSeasonSummaries,
  getCropSeasonListSummary,
  getCropSeasonTimeline
} from "../../src/server/services/crop-seasons/listing.service";

const seasons = [
  {
    id: "season_1",
    cropName: "Wheat",
    variety: "Galaxy",
    status: "ACTIVE",
    startDate: new Date("2026-11-15"),
    endDate: new Date("2027-04-30"),
    block: { name: "Block A", farm: { name: "Green Valley" } },
    harvests: [{ quantity: 40 }, { quantity: 10 }],
    expenses: [{ amount: 5000 }]
  },
  {
    id: "season_2",
    cropName: "Mango",
    variety: null,
    status: "PLANNED",
    startDate: new Date("2026-02-10"),
    endDate: null,
    block: { name: "North Field", farm: { name: "Canal View" } },
    harvests: [],
    expenses: [{ amount: 750 }]
  }
];

describe("crop season listing service", () => {
  it("filters crop seasons by crop, variety, farm, block, and status", () => {
    expect(filterCropSeasonSummaries(seasons, { query: "galaxy" }).map((season) => season.id)).toEqual(["season_1"]);
    expect(filterCropSeasonSummaries(seasons, { query: "canal" }).map((season) => season.id)).toEqual(["season_2"]);
    expect(filterCropSeasonSummaries(seasons, { status: "ACTIVE" }).map((season) => season.id)).toEqual(["season_1"]);
  });

  it("derives dynamic list stats from visible seasons", () => {
    expect(getCropSeasonListSummary(seasons)).toEqual({
      seasonCount: 2,
      activeSeasonCount: 1,
      primaryCrop: "Wheat",
      nearestHarvestDate: new Date("2027-04-30"),
      actualYield: 50,
      expenseTotal: 5750
    });
  });

  it("builds a lifecycle timeline without hardcoded crop examples", () => {
    expect(getCropSeasonTimeline(seasons[0])).toEqual([
      { label: "Planned", complete: true },
      { label: "Active", complete: true },
      { label: "Harvested", complete: false },
      { label: "Closed", complete: false }
    ]);
  });
});
