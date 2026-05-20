import { describe, expect, it } from "vitest";

import {
  filterFarmSummaries,
  filterLandBlockSummaries,
  getFarmListSummary,
  getLandBlockListSummary
} from "../../src/server/services/farms/listing.service";

const farms = [
  {
    id: "farm_1",
    name: "Green Valley",
    location: "Multan",
    managers: [{ manager: { name: "Ayesha Khan", email: "ayesha@example.com" } }],
    blocks: [
      { areaAcres: 10, seasons: [{ status: "ACTIVE" }] },
      { areaAcres: 5, seasons: [] }
    ]
  },
  {
    id: "farm_2",
    name: "Canal View",
    location: "Okara",
    managers: [],
    blocks: [{ areaAcres: 7.5, seasons: [{ status: "PLANNED" }] }]
  }
];

const blocks = [
  {
    id: "block_1",
    name: "Block A",
    areaAcres: 12,
    farm: { name: "Green Valley" },
    seasons: [{ status: "ACTIVE" }]
  },
  {
    id: "block_2",
    name: "North Field",
    areaAcres: null,
    farm: { name: "Canal View" },
    seasons: []
  }
];

describe("farm listing service", () => {
  it("filters farms by name, location, manager, and active season state", () => {
    expect(filterFarmSummaries(farms, { query: "ayesha" })).toHaveLength(1);
    expect(filterFarmSummaries(farms, { query: "okara" })).toHaveLength(1);
    expect(filterFarmSummaries(farms, { seasonState: "active" }).map((farm) => farm.id)).toEqual(["farm_1"]);
    expect(filterFarmSummaries(farms, { seasonState: "idle" }).map((farm) => farm.id)).toEqual(["farm_2"]);
  });

  it("summarizes the filtered farm list", () => {
    expect(getFarmListSummary(farms)).toEqual({
      farmCount: 2,
      blockCount: 3,
      totalArea: 22.5,
      activeSeasonCount: 1
    });
  });
});

describe("land block listing service", () => {
  it("filters land blocks by block name, farm name, and active season state", () => {
    expect(filterLandBlockSummaries(blocks, { query: "green" }).map((block) => block.id)).toEqual(["block_1"]);
    expect(filterLandBlockSummaries(blocks, { query: "north" }).map((block) => block.id)).toEqual(["block_2"]);
    expect(filterLandBlockSummaries(blocks, { seasonState: "active" }).map((block) => block.id)).toEqual(["block_1"]);
    expect(filterLandBlockSummaries(blocks, { seasonState: "idle" }).map((block) => block.id)).toEqual(["block_2"]);
  });

  it("summarizes the filtered land block list", () => {
    expect(getLandBlockListSummary(blocks)).toEqual({
      blockCount: 2,
      totalArea: 12,
      activeBlockCount: 1
    });
  });
});
