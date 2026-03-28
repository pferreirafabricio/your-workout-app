import { describe, expect, it } from "vitest";
import {
  buildProgressionSeries,
  calculateSetVolume,
  calculateWorkoutSummary,
} from "@/lib/features/workouts/workouts.server";

describe("workouts server helpers", () => {
  it("calculates set volume using weight x reps", () => {
    expect(calculateSetVolume(82.5, 5)).toBe(412.5);
  });

  it("calculates workout summary totals and duration from first logged set", () => {
    const startedAt = new Date("2026-03-28T10:00:00.000Z");
    const completedAt = new Date("2026-03-28T10:45:15.000Z");

    const summary = calculateWorkoutSummary(startedAt, completedAt, [
      { weightSnapshotKg: 100, reps: 5, loggedAt: new Date("2026-03-28T10:05:00.000Z") },
      { weightSnapshotKg: 80, reps: 8, loggedAt: new Date("2026-03-28T10:20:00.000Z") },
    ]);

    expect(summary.durationSeconds).toBe(2415);
    expect(summary.totalSets).toBe(2);
    expect(summary.totalVolumeKg).toBe(1140);
  });

  it("falls back to workout start time when no sets are logged", () => {
    const startedAt = new Date("2026-03-28T10:00:00.000Z");
    const completedAt = new Date("2026-03-28T10:45:15.000Z");

    const summary = calculateWorkoutSummary(startedAt, completedAt, []);

    expect(summary.durationSeconds).toBe(2715);
    expect(summary.totalSets).toBe(0);
    expect(summary.totalVolumeKg).toBe(0);
  });

  it("builds progression series for max weight", () => {
    const series = buildProgressionSeries(
      [
        { loggedAt: new Date("2026-03-01T10:00:00.000Z"), reps: 5, weightSnapshotKg: 80 },
        { loggedAt: new Date("2026-03-01T10:10:00.000Z"), reps: 5, weightSnapshotKg: 85 },
        { loggedAt: new Date("2026-03-02T10:00:00.000Z"), reps: 5, weightSnapshotKg: 90 },
      ],
      "maxWeight",
    );

    expect(series).toHaveLength(2);
    expect(series[0]?.value).toBe(85);
    expect(series[1]?.value).toBe(90);
  });

  it("builds progression series for total reps", () => {
    const series = buildProgressionSeries(
      [
        { loggedAt: new Date("2026-03-03T10:00:00.000Z"), reps: 8, weightSnapshotKg: 50 },
        { loggedAt: new Date("2026-03-03T10:05:00.000Z"), reps: 6, weightSnapshotKg: 50 },
      ],
      "totalReps",
    );

    expect(series).toHaveLength(1);
    expect(series[0]?.value).toBe(14);
  });

  it("builds progression series for total volume", () => {
    const series = buildProgressionSeries(
      [
        { loggedAt: new Date("2026-03-04T10:00:00.000Z"), reps: 10, weightSnapshotKg: 60 },
        { loggedAt: new Date("2026-03-04T10:10:00.000Z"), reps: 8, weightSnapshotKg: 65 },
      ],
      "totalVolume",
    );

    expect(series).toHaveLength(1);
    expect(series[0]?.value).toBe(1120);
  });

  it("groups progression points by user timezone calendar day", () => {
    const series = buildProgressionSeries(
      [
        { loggedAt: new Date("2026-03-28T00:30:00.000Z"), reps: 5, weightSnapshotKg: 80 },
        { loggedAt: new Date("2026-03-28T08:30:00.000Z"), reps: 5, weightSnapshotKg: 90 },
      ],
      "maxWeight",
      "America/Los_Angeles",
    );

    expect(series).toHaveLength(2);
    expect(series[0]?.date).toBe("2026-03-27");
    expect(series[0]?.value).toBe(80);
    expect(series[1]?.date).toBe("2026-03-28");
    expect(series[1]?.value).toBe(90);
  });

  it("falls back to UTC grouping for invalid timezone", () => {
    const series = buildProgressionSeries(
      [{ loggedAt: new Date("2026-03-28T00:30:00.000Z"), reps: 5, weightSnapshotKg: 80 }],
      "maxWeight",
      "Invalid/Timezone",
    );

    expect(series).toHaveLength(1);
    expect(series[0]?.date).toBe("2026-03-28");
  });

  it("handles rest elapsed baseline edge (same start/end)", () => {
    const now = new Date("2026-03-28T10:00:00.000Z");
    const summary = calculateWorkoutSummary(now, now, []);
    expect(summary.durationSeconds).toBe(0);
    expect(summary.totalVolumeKg).toBe(0);
  });
});
