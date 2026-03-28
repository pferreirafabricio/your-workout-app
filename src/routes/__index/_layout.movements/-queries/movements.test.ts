import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/movements.server", () => ({
  getEquipmentCatalogServerFn: vi.fn(async () => [
    { id: "equipment-barbell", code: "barbell", name: "Barbell", isActive: true, displayOrder: 10 },
  ]),
  getMovementsServerFn: vi.fn(async () => [
    {
      id: "m1",
      name: "Bench Press",
      type: "WEIGHTED",
      muscleGroup: "CHEST",
      archivedAt: null,
      equipment: { id: "equipment-barbell", name: "Barbell" },
    },
  ]),
}));

import { equipmentQueryOptions, movementsQueryOptions } from "./movements";

describe("movements query integration", () => {
  it("returns movement metadata including muscle group and equipment", async () => {
    const options = movementsQueryOptions();
    const result = (await options.queryFn?.({ queryKey: options.queryKey } as never)) ?? [];

    expect(options.queryKey).toEqual(["movements"]);
    expect(result[0]?.muscleGroup).toBe("CHEST");
    expect(result[0]?.equipment?.name).toBe("Barbell");
  });

  it("returns equipment catalog in display order", async () => {
    const options = equipmentQueryOptions();
    const result = (await options.queryFn?.({ queryKey: options.queryKey } as never)) ?? [];

    expect(options.queryKey).toEqual(["equipment-catalog"]);
    expect(result[0]?.code).toBe("barbell");
    expect(result.every((item) => item.isActive)).toBe(true);
  });
});
