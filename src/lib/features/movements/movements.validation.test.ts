import { describe, expect, it } from "vitest";
import {
  archiveMovementInputSchema,
  createMovementInputSchema,
  updateMovementInputSchema,
} from "@/lib/features/movements/movements.validation";

describe("movements validation", () => {
  it("accepts valid create payload", () => {
    const parsed = createMovementInputSchema.safeParse({
      name: "Incline Dumbbell Press",
      type: "WEIGHTED",
      muscleGroup: "CHEST",
      equipmentId: "equipment-id",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid movement type", () => {
    const parsed = createMovementInputSchema.safeParse({
      name: "Push-up",
      type: "INVALID",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires movement id for updates", () => {
    const parsed = updateMovementInputSchema.safeParse({
      name: "Pull-up",
      type: "BODYWEIGHT",
      muscleGroup: "BACK",
      equipmentId: null,
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts archive toggle payload", () => {
    const parsed = archiveMovementInputSchema.safeParse({
      movementId: "movement-id",
      archive: true,
    });

    expect(parsed.success).toBe(true);
  });
});
