import type { ProgressionMetric } from "@/lib/shared/consts";

export type WorkoutSummary = {
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
};

export function calculateSetVolume(weightKg: number, reps: number): number {
  return Math.round(weightKg * reps * 100) / 100;
}

export function calculateWorkoutSummary(
  startedAt: Date,
  completedAt: Date,
  sets: Array<{ weightSnapshotKg: number; reps: number; loggedAt: Date }>,
): WorkoutSummary {
  const firstSetLoggedAt =
    sets.length > 0
      ? sets.reduce((earliest, set) => (set.loggedAt < earliest ? set.loggedAt : earliest), sets[0].loggedAt)
      : null;

  const effectiveStartedAt =
    firstSetLoggedAt && firstSetLoggedAt.getTime() > startedAt.getTime() ? firstSetLoggedAt : startedAt;

  return {
    durationSeconds: Math.max(0, Math.floor((completedAt.getTime() - effectiveStartedAt.getTime()) / 1000)),
    totalVolumeKg:
      Math.round(sets.reduce((sum, set) => sum + calculateSetVolume(set.weightSnapshotKg, set.reps), 0) * 100) / 100,
    totalSets: sets.length,
  };
}

function getDayKey(input: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(input);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return "1970-01-01";
  }
  return `${year}-${month}-${day}`;
}

function normalizeDay(input: Date): string {
  return getDayKey(input, "UTC");
}

function normalizeDayForTimeZone(input: Date, timeZone: string): string {
  try {
    return getDayKey(input, timeZone);
  } catch {
    return normalizeDay(input);
  }
}

export function buildProgressionSeries(
  rows: Array<{ loggedAt: Date; reps: number; weightSnapshotKg: number }>,
  metric: ProgressionMetric,
  timeZone = "UTC",
) {
  const grouped = new Map<string, Array<{ reps: number; weightSnapshotKg: number }>>();

  for (const row of rows) {
    const key = normalizeDayForTimeZone(row.loggedAt, timeZone);
    const bucket = grouped.get(key) ?? [];
    bucket.push({ reps: row.reps, weightSnapshotKg: row.weightSnapshotKg });
    grouped.set(key, bucket);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, points]) => {
      if (metric === "maxWeight") {
        return { date, value: Math.max(...points.map((p) => p.weightSnapshotKg)) };
      }
      if (metric === "totalReps") {
        return { date, value: points.reduce((sum, point) => sum + point.reps, 0) };
      }
      return {
        date,
        value: Math.round(points.reduce((sum, point) => sum + point.reps * point.weightSnapshotKg, 0) * 100) / 100,
      };
    });
}
