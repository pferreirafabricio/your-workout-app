import { describe, expect, it } from "vitest";
import {
  createEquipmentInputSchema,
  setEquipmentActiveStateInputSchema,
  updateEquipmentInputSchema,
} from "@/lib/features/workouts/workout-progression";

describe("equipment validation schemas", () => {
  it("normalizes equipment code and accepts valid create payload", () => {
    const parsed = createEquipmentInputSchema.safeParse({
      code: "cable machine",
      name: "Cable Machine",
      displayOrder: 30,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("CABLE_MACHINE");
    }
  });

  it("rejects out-of-range display order", () => {
    const parsed = createEquipmentInputSchema.safeParse({
      code: "BARBELL",
      name: "Barbell",
      displayOrder: 10000,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires equipment id for updates", () => {
    const parsed = updateEquipmentInputSchema.safeParse({
      code: "DUMBBELL",
      name: "Dumbbell",
      displayOrder: 20,
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts active-state toggle payload", () => {
    const parsed = setEquipmentActiveStateInputSchema.safeParse({
      equipmentId: "equipment-id",
      isActive: false,
    });

    expect(parsed.success).toBe(true);
  });
});
