import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/workouts.server", () => ({
  getBodyWeightSeriesServerFn: vi.fn(async () => []),
  getCurrentWorkoutServerFn: vi.fn(async () => ({ id: "w1", sets: [] })),
  getUserPreferencesServerFn: vi.fn(async () => ({ weightUnit: "kg", defaultRestTargetSeconds: 120 })),
}));

vi.mock("@/lib/movements.server", () => ({
  getEquipmentCatalogServerFn: vi.fn(async () => []),
  getMovementsServerFn: vi.fn(async () => []),
}));

import {
  bodyWeightSeriesQueryOptions,
  currentWorkoutQueryOptions,
  equipmentCatalogQueryOptions,
  movementsQueryOptions,
  userPreferencesQueryOptions,
} from "./current-workout";
import { updateSetInputSchema } from "@/lib/validation/workout-progression";

describe("current workout query options", () => {
  it("creates stable query key for current workout", async () => {
    const options = currentWorkoutQueryOptions();
    expect(options.queryKey).toEqual(["current-workout"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual({ id: "w1", sets: [] });
  });

  it("creates movements query option", async () => {
    const options = movementsQueryOptions();
    expect(options.queryKey).toEqual(["movements"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual([]);
  });

  it("creates equipment catalog query option", async () => {
    const options = equipmentCatalogQueryOptions();
    expect(options.queryKey).toEqual(["equipment-catalog"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual([]);
  });

  it("creates user preference and bodyweight query options", async () => {
    const pref = userPreferencesQueryOptions();
    const weight = bodyWeightSeriesQueryOptions();

    expect(pref.queryKey).toEqual(["user-preferences"]);
    expect(weight.queryKey).toEqual(["body-weight-series"]);

    await expect(pref.queryFn?.({ queryKey: pref.queryKey } as never)).resolves.toEqual({ weightUnit: "kg", defaultRestTargetSeconds: 120 });
    await expect(weight.queryFn?.({ queryKey: weight.queryKey } as never)).resolves.toEqual([]);
  });
});

describe("current workout conflict and mutation contract checks", () => {
  it("accepts expectedVersion for last-write-wins replacement notice flows", () => {
    const parsed = updateSetInputSchema.safeParse({
      setId: "set_1",
      reps: 8,
      weight: 72.5,
      expectedVersion: 3,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid expectedVersion values", () => {
    const parsed = updateSetInputSchema.safeParse({
      setId: "set_1",
      reps: 8,
      weight: 72.5,
      expectedVersion: 0,
    });

    expect(parsed.success).toBe(false);
  });
});
