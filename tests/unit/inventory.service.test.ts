import { describe, expect, it } from "vitest";

import { calculateInventoryQuantity } from "@/server/services/inventory.service";

describe("calculateInventoryQuantity", () => {
  it("increases stock for purchases", () => {
    expect(
      calculateInventoryQuantity({
        currentQuantity: 10,
        movementType: "PURCHASE",
        movementQuantity: 5
      })
    ).toBe(15);
  });

  it("decreases stock for usage, adjustment, and wastage movements", () => {
    expect(
      calculateInventoryQuantity({
        currentQuantity: 10,
        movementType: "USAGE",
        movementQuantity: 3
      })
    ).toBe(7);

    expect(
      calculateInventoryQuantity({
        currentQuantity: 10,
        movementType: "ADJUSTMENT",
        movementQuantity: 2
      })
    ).toBe(8);

    expect(
      calculateInventoryQuantity({
        currentQuantity: 10,
        movementType: "WASTAGE",
        movementQuantity: 1
      })
    ).toBe(9);
  });

  it("prevents negative stock unless explicitly allowed", () => {
    expect(() =>
      calculateInventoryQuantity({
        currentQuantity: 2,
        movementType: "USAGE",
        movementQuantity: 5
      })
    ).toThrow("Inventory movement would make stock negative.");

    expect(
      calculateInventoryQuantity({
        currentQuantity: 2,
        movementType: "USAGE",
        movementQuantity: 5,
        allowNegativeStock: true
      })
    ).toBe(-3);
  });
});
