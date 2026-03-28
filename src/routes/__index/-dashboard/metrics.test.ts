import { describe, expect, it } from "vitest";
import {
  getMovementMetricLabel,
  getMovementMetricUnit,
  getNutritionMetricLabel,
  getNutritionMetricUnit,
  MOVEMENT_METRICS,
  NUTRITION_METRICS,
} from "./metrics";

describe("dashboard metric metadata", () => {
  it("includes expected movement metrics", () => {
    expect(MOVEMENT_METRICS.map((metric) => metric.value)).toEqual(["maxWeight", "totalReps", "totalVolume"]);
  });

  it("includes expected nutrition metrics", () => {
    expect(NUTRITION_METRICS.map((metric) => metric.value)).toEqual([
      "calories",
      "protein",
      "carbs",
      "fats",
      "bodyWeight",
    ]);
  });

  it("resolves labels and units", () => {
    expect(getMovementMetricLabel("maxWeight")).toBe("Maximum Weight");
    expect(getMovementMetricUnit("totalReps")).toBe("reps");
    expect(getNutritionMetricLabel("bodyWeight")).toBe("Bodyweight");
    expect(getNutritionMetricUnit("calories")).toBe("kcal");
  });
});
