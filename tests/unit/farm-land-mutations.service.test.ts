import { describe, expect, it, vi } from "vitest";

import {
  createFarm,
  createLandBlock,
  updateFarm,
  updateLandBlock
} from "../../src/server/services/farms/mutations.service";

describe("farm mutation service", () => {
  it("creates a farm with an optional initial land block", async () => {
    const db = {
      farm: {
        create: vi.fn().mockResolvedValue({ id: "farm_1" })
      }
    };

    const farm = await createFarm(db, {
      name: "Green Valley",
      address: "Chak 12, Multan Road",
      area: 42.5,
      type: "LEASE",
      location: undefined,
      farmCode: "GV-001",
      city: "Multan",
      district: "Multan",
      soilType: "Loam",
      irrigationMethod: "Drip",
      waterSourcesCount: 2,
      permanentWorkersCount: 5,
      seasonalBudget: 550000,
      initialBlockName: "Block A",
      initialBlockAreaAcres: 12.5
    });

    expect(farm.id).toBe("farm_1");
    expect(db.farm.create).toHaveBeenCalledWith({
      data: {
        name: "Green Valley",
        address: "Chak 12, Multan Road",
        area: 42.5,
        type: "LEASE",
        location: undefined,
        farmCode: "GV-001",
        city: "Multan",
        district: "Multan",
        soilType: "Loam",
        irrigationMethod: "Drip",
        waterSourcesCount: 2,
        permanentWorkersCount: 5,
        seasonalBudget: 550000,
        blocks: {
          create: {
            name: "Block A",
            areaAcres: 12.5
          }
        }
      }
    });
  });

  it("updates farm fields by id", async () => {
    const db = {
      farm: {
        update: vi.fn().mockResolvedValue({ id: "farm_1" })
      }
    };

    await updateFarm(db, "farm_1", {
      name: "Updated Farm",
      address: "Updated address",
      area: 50,
      type: "OWNER",
      location: undefined
    });

    expect(db.farm.update).toHaveBeenCalledWith({
      where: { id: "farm_1" },
      data: {
        name: "Updated Farm",
        address: "Updated address",
        area: 50,
        type: "OWNER",
        location: undefined
      }
    });
  });
});

describe("land block mutation service", () => {
  it("creates a land block under a farm", async () => {
    const db = {
      landBlock: {
        create: vi.fn().mockResolvedValue({ id: "block_1" })
      }
    };

    const block = await createLandBlock(db, {
      farmId: "farm_1",
      name: "Block A",
      areaAcres: 12
    });

    expect(block.id).toBe("block_1");
    expect(db.landBlock.create).toHaveBeenCalledWith({
      data: {
        farmId: "farm_1",
        name: "Block A",
        areaAcres: 12
      }
    });
  });

  it("updates land block fields by id", async () => {
    const db = {
      landBlock: {
        update: vi.fn().mockResolvedValue({ id: "block_1" })
      }
    };

    await updateLandBlock(db, "block_1", {
      farmId: "farm_1",
      name: "Block B",
      areaAcres: undefined
    });

    expect(db.landBlock.update).toHaveBeenCalledWith({
      where: { id: "block_1" },
      data: {
        farmId: "farm_1",
        name: "Block B",
        areaAcres: undefined
      }
    });
  });
});
