import { formatDateKey } from "@/lib/shared/utils";
import type { NutritionMetric } from "./metrics";

export type ProgressionPoint = {
  date: string;
  value: number;
};

export type NutritionPoint = {
  localDate: string;
  caloriesCanonical: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  bodyWeight: number | null;
};

export type ChartPoint = {
  date: string;
  axisDate: string;
  value: number;
};

function axisDateFromKey(dateKey: string): string {
  return formatDateKey(dateKey, { formatOptions: { month: "short", day: "numeric" } });
}

export function mapProgressionSeriesToChart(points: ProgressionPoint[]): ChartPoint[] {
  return points.map((point) => ({
    date: point.date,
    axisDate: axisDateFromKey(point.date),
    value: point.value,
  }));
}

export function mapNutritionSeriesToChart(points: NutritionPoint[], metric: NutritionMetric): ChartPoint[] {
  return points
    .map((point) => {
      const metricValue =
        metric === "calories"
          ? point.caloriesCanonical
          : metric === "protein"
            ? point.proteinG
            : metric === "carbs"
              ? point.carbsG
              : metric === "fats"
                ? point.fatsG
                : point.bodyWeight;

      return {
        date: point.localDate,
        axisDate: axisDateFromKey(point.localDate),
        value: metricValue,
      };
    })
    .filter((point): point is ChartPoint => typeof point.value === "number");
}
