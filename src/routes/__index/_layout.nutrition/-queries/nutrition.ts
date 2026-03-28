import { queryOptions } from "@tanstack/react-query";
import {
  getNutritionDailyLogServerFn,
  getNutritionDefaultsServerFn,
  getNutritionGoalsServerFn,
  getNutritionHistoryServerFn,
  listNutritionFoodsServerFn,
} from "@/lib/features/nutrition/nutrition.server";

export const nutritionDefaultsQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-defaults"],
    queryFn: () => getNutritionDefaultsServerFn(),
  });

export const nutritionDailyLogQueryOptions = (localDate?: string) =>
  queryOptions({
    queryKey: ["nutrition-daily-log", localDate ?? "today"],
    queryFn: () => getNutritionDailyLogServerFn({ data: localDate ? { date: localDate } : {} }),
  });

export const nutritionGoalsQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-goals"],
    queryFn: () => getNutritionGoalsServerFn(),
  });

export const nutritionFoodsQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-foods"],
    queryFn: () => listNutritionFoodsServerFn(),
  });

export const nutritionHistoryQueryOptions = (startDate: string, endDate: string, includeBodyWeight: boolean) =>
  queryOptions({
    queryKey: ["nutrition-history", startDate, endDate, includeBodyWeight],
    queryFn: () => getNutritionHistoryServerFn({ data: { startDate, endDate, includeBodyWeight } }),
    enabled: Boolean(startDate && endDate),
  });
