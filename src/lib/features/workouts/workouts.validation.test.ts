import { describe, expect, it } from "vitest";
import {
  addSetInputSchema,
  parseOptionalDate,
  parseOptionalEndDateInclusive,
  progressionSeriesInputSchema,
  setUserPreferencesInputSchema,
  updateSetInputSchema,
} from "@/lib/features/workouts/workouts.validation";

describe("workouts validation", () => {
  it("accepts add set payload", () => {
    const parsed = addSetInputSchema.safeParse({
      movementId: "movement-id",
      reps: 10,
      weight: 80,
      rpe: 8,
      notes: "Felt strong",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid add set payload", () => {
    const parsed = addSetInputSchema.safeParse({
      movementId: "",
      reps: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it("validates expectedVersion in update set payload", () => {
    expect(
      updateSetInputSchema.safeParse({
        setId: "set-id",
        expectedVersion: 3,
      }).success,
    ).toBe(true);

    expect(
      updateSetInputSchema.safeParse({
        setId: "set-id",
        expectedVersion: 0,
      }).success,
    ).toBe(false);
  });

  it("validates timezone in user preferences payload", () => {
    expect(
      setUserPreferencesInputSchema.safeParse({
        weightUnit: "kg",
        defaultRestTargetSeconds: 120,
        timeZone: "UTC",
      }).success,
    ).toBe(true);

    expect(
      setUserPreferencesInputSchema.safeParse({
        weightUnit: "kg",
        defaultRestTargetSeconds: 120,
        timeZone: "Invalid/Timezone",
      }).success,
    ).toBe(false);
  });

  it("accepts progression-series payload", () => {
    const parsed = progressionSeriesInputSchema.safeParse({
      movementId: "movement-id",
      metric: "maxWeight",
    });

    expect(parsed.success).toBe(true);
  });

  it("parses date-only input at midnight for general parsing", () => {
    expect(parseOptionalDate("2026-03-29")?.toISOString()).toBe("2026-03-29T00:00:00.000Z");
  });

  it("parses date-only end dates as end-of-day inclusive", () => {
    expect(parseOptionalEndDateInclusive("2026-03-29")?.toISOString()).toBe("2026-03-29T23:59:59.999Z");
  });
});
