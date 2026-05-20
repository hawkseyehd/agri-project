import { describe, expect, it } from "vitest";

import { farmSchema, farmWithInitialBlockSchema, landBlockSchema } from "../../src/server/validators/farm-land.schema";

describe("farmSchema", () => {
  it("accepts a detailed farm with only name, address, area, and type required", () => {
    const result = farmSchema.safeParse({
      name: "Green Valley Farm",
      address: "Chak 12, Multan Road",
      area: "42.5",
      type: "LEASE",
      location: "",
      farmCode: "GV-001",
      city: "Multan",
      district: "Multan",
      country: "Pakistan",
      gpsCoordinates: "30.1575,71.5249",
      soilType: "Loam",
      soilPh: "7.2",
      irrigationMethod: "Drip",
      waterSourcesCount: "2",
      permanentWorkersCount: "5",
      seasonalWorkersCount: "12",
      openingBalance: "150000",
      seasonalBudget: "550000"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.area).toBe(42.5);
      expect(result.data.type).toBe("LEASE");
      expect(result.data.location).toBeUndefined();
      expect(result.data.waterSourcesCount).toBe(2);
      expect(result.data.permanentWorkersCount).toBe(5);
    }
  });

  it("rejects missing required farm identity fields", () => {
    const result = farmSchema.safeParse({
      name: "",
      address: "",
      area: "",
      type: ""
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name?.[0]).toBe("Farm name must be at least 2 characters.");
      expect(errors.address?.[0]).toBe("Address is required.");
      expect(errors.area?.[0]).toBe("Area is required.");
      expect(errors.type?.[0]).toBe("Farm type is required.");
    }
  });
});

describe("farmWithInitialBlockSchema", () => {
  it("allows creating a farm with its first land block", () => {
    const result = farmWithInitialBlockSchema.safeParse({
      name: "Green Valley Farm",
      address: "Okara Road",
      area: "20",
      type: "OWNER",
      location: "Okara",
      initialBlockName: "Block A",
      initialBlockAreaAcres: "12.5"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.initialBlockName).toBe("Block A");
      expect(result.data.initialBlockAreaAcres).toBe(12.5);
    }
  });

  it("keeps the first block optional while validating partial block details", () => {
    const withoutBlock = farmWithInitialBlockSchema.safeParse({
      name: "Green Valley Farm",
      address: "Okara Road",
      area: "20",
      type: "OWNER",
      location: "",
      initialBlockName: "",
      initialBlockAreaAcres: ""
    });

    expect(withoutBlock.success).toBe(true);

    const missingName = farmWithInitialBlockSchema.safeParse({
      name: "Green Valley Farm",
      address: "Okara Road",
      area: "20",
      type: "OWNER",
      location: "",
      initialBlockName: "",
      initialBlockAreaAcres: "4"
    });

    expect(missingName.success).toBe(false);
    if (!missingName.success) {
      expect(missingName.error.flatten().fieldErrors.initialBlockName?.[0]).toBe("Block name is required when block area is set.");
    }
  });
});

describe("landBlockSchema", () => {
  it("accepts a land block with acreage", () => {
    const result = landBlockSchema.safeParse({
      farmId: "farm_123",
      name: "Block A",
      areaAcres: "12.5"
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative acreage", () => {
    const result = landBlockSchema.safeParse({
      farmId: "farm_123",
      name: "Block A",
      areaAcres: "-1"
    });

    expect(result.success).toBe(false);
  });
});
