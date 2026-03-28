import { getWorkoutHistoryServerFn } from "@/lib/workouts.server";
import { getBodyWeightSeriesServerFn, getProgressionSeriesServerFn } from "@/lib/workouts.server";
import { queryOptions } from "@tanstack/react-query";

export const workoutHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["workout-history"],
    queryFn: () => getWorkoutHistoryServerFn(),
  });

export const progressionSeriesQueryOptions = (movementId: string, metric: "maxWeight" | "totalReps" | "totalVolume") =>
  queryOptions({
    queryKey: ["progression-series", movementId, metric],
    queryFn: () => getProgressionSeriesServerFn({ data: { movementId, metric } }),
    enabled: Boolean(movementId),
  });

export const bodyWeightHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["body-weight-history"],
    queryFn: () => getBodyWeightSeriesServerFn({ data: {} }),
  });
