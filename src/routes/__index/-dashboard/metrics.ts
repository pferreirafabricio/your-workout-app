export type MovementMetric = "maxWeight" | "totalReps" | "totalVolume";
export type NutritionMetric = "calories" | "protein" | "carbs" | "fats" | "bodyWeight";

type MetricMeta<T extends string> = {
  value: T;
  label: string;
  unit: string;
};

export const MOVEMENT_METRICS: readonly MetricMeta<MovementMetric>[] = [
  { value: "maxWeight", label: "Maximum Weight", unit: "kg" },
  { value: "totalReps", label: "Total Reps", unit: "reps" },
  { value: "totalVolume", label: "Total Volume", unit: "kg*reps" },
] as const;

export const NUTRITION_METRICS: readonly MetricMeta<NutritionMetric>[] = [
  { value: "calories", label: "Calories", unit: "kcal" },
  { value: "protein", label: "Protein", unit: "g" },
  { value: "carbs", label: "Carbs", unit: "g" },
  { value: "fats", label: "Fats", unit: "g" },
  { value: "bodyWeight", label: "Bodyweight", unit: "kg" },
] as const;

const movementMetricMeta = new Map(MOVEMENT_METRICS.map((metric) => [metric.value, metric]));
const nutritionMetricMeta = new Map(NUTRITION_METRICS.map((metric) => [metric.value, metric]));

export function getMovementMetricLabel(metric: MovementMetric): string {
  return movementMetricMeta.get(metric)?.label ?? metric;
}

export function getMovementMetricUnit(metric: MovementMetric): string {
  return movementMetricMeta.get(metric)?.unit ?? "";
}

export function getNutritionMetricLabel(metric: NutritionMetric): string {
  return nutritionMetricMeta.get(metric)?.label ?? metric;
}

export function getNutritionMetricUnit(metric: NutritionMetric): string {
  return nutritionMetricMeta.get(metric)?.unit ?? "";
}
