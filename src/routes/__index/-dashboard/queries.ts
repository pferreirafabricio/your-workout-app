import { queryOptions } from "@tanstack/react-query";
import { getMovementsServerFn } from "@/lib/features/movements/movements.server";
import { getProgressionSeriesServerFn } from "@/lib/features/workouts/workouts.server";
import { getNutritionDefaultsServerFn, getNutritionHistoryServerFn } from "@/lib/features/nutrition/nutrition.server";
import type { MovementMetric } from "./metrics";

export const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovementsServerFn(),
  });

export const nutritionDefaultsQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-defaults"],
    queryFn: () => getNutritionDefaultsServerFn(),
  });

export const progressionSeriesQueryOptions = (
  movementId: string,
  metric: MovementMetric,
  startDate: string,
  endDate: string,
  enabled = true,
) =>
  queryOptions({
    queryKey: ["dashboard-progression-series", movementId, metric, startDate, endDate],
    queryFn: () => getProgressionSeriesServerFn({ data: { movementId, metric, startDate, endDate } }),
    enabled: enabled && Boolean(movementId && startDate && endDate),
  });

export const nutritionHistoryQueryOptions = (startDate: string, endDate: string, enabled = true) =>
  queryOptions({
    queryKey: ["dashboard-nutrition-history", startDate, endDate],
    queryFn: () => getNutritionHistoryServerFn({ data: { startDate, endDate, includeBodyWeight: true } }),
    enabled: enabled && Boolean(startDate && endDate),
  });
