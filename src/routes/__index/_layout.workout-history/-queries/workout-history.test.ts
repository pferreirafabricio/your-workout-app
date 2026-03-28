import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/features/workouts/workouts.server", () => ({
  getBodyWeightSeriesServerFn: vi.fn(async () => [{ date: "2026-03-01", weight: 80 }]),
  getProgressionSeriesServerFn: vi.fn(async () => [{ date: "2026-03-01", value: 100 }]),
  getUserPreferencesServerFn: vi.fn(async () => ({ weightUnit: "kg", defaultRestTargetSeconds: 120, timeZone: "UTC" })),
  getWorkoutHistoryServerFn: vi.fn(async () => [{ id: "w1", sets: [] }]),
}));

import {
  bodyWeightHistoryQueryOptions,
  progressionSeriesQueryOptions,
  userPreferencesQueryOptions,
  workoutHistoryQueryOptions,
} from "./workout-history";

describe("workout history query options", () => {
  it("builds workout history query option", async () => {
    const options = workoutHistoryQueryOptions();
    expect(options.queryKey).toEqual(["workout-history"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual([{ id: "w1", sets: [] }]);
  });

  it("builds progression series query option", async () => {
    const options = progressionSeriesQueryOptions("movement_1", "totalVolume");
    expect(options.queryKey).toEqual(["progression-series", "movement_1", "totalVolume"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual([{ date: "2026-03-01", value: 100 }]);
  });

  it("disables progression query without movement", () => {
    const options = progressionSeriesQueryOptions("", "maxWeight");
    expect(options.enabled).toBe(false);
  });

  it("builds bodyweight history query option", async () => {
    const options = bodyWeightHistoryQueryOptions();
    expect(options.queryKey).toEqual(["body-weight-history"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual([{ date: "2026-03-01", weight: 80 }]);
  });

  it("builds user preferences query option", async () => {
    const options = userPreferencesQueryOptions();
    expect(options.queryKey).toEqual(["user-preferences"]);
    await expect(options.queryFn?.({ queryKey: options.queryKey } as never)).resolves.toEqual({
      weightUnit: "kg",
      defaultRestTargetSeconds: 120,
      timeZone: "UTC",
    });
  });
});
