import { describe, expect, it } from "vitest";

import { inventoryItemSchema } from "@/server/validators/inventory.schema";

describe("inventoryItemSchema", () => {
  it("requires an inventory item type", () => {
    const parsed = inventoryItemSchema.safeParse({
      farmId: "farm_1",
      name: "Urea",
      itemType: "",
      unit: "BAG",
      quantity: "10",
      lowStockLevel: "2"
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.itemType?.[0]).toBe("Item type is required.");
    }
  });

  it("defaults an empty low-stock level to zero", () => {
    const parsed = inventoryItemSchema.parse({
      farmId: "farm_1",
      name: "Urea",
      itemType: "Fertiliser",
      unit: "BAG",
      quantity: "10",
      lowStockLevel: ""
    });

    expect(parsed.lowStockLevel).toBe("0");
  });
});
