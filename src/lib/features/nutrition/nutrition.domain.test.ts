import { describe, expect, it } from "vitest";
import {
  aggregateDailyTrendPoints,
  calculateRemainingCalories,
  calculateCanonicalCalories,
  calculateMacroPercentages,
  computeBalanceLabel,
  hasCalorieMismatch,
} from "@/lib/features/nutrition/nutrition.domain";

describe("nutrition domain", () => {
  it("calculates canonical calories from macros", () => {
    expect(calculateCanonicalCalories({ proteinG: 25, carbsG: 40, fatsG: 10 })).toBe(350);
  });

  it("calculates macro percentages", () => {
    const percentages = calculateMacroPercentages({ proteinG: 25, carbsG: 40, fatsG: 10 });
    expect(percentages.proteinPct).toBeGreaterThan(0);
    expect(percentages.carbsPct).toBeGreaterThan(0);
    expect(percentages.fatsPct).toBeGreaterThan(0);
  });

  it("detects mismatch between entered and canonical calories", () => {
    expect(hasCalorieMismatch(300, 350)).toBe(true);
    expect(hasCalorieMismatch(350, 350)).toBe(false);
  });

  it("computes balance labels", () => {
    expect(computeBalanceLabel(100)).toBe("SURPLUS");
    expect(computeBalanceLabel(-50)).toBe("DEFICIT");
    expect(computeBalanceLabel(0)).toBe("ON_TARGET");
  });

  it("computes remaining calories from target and consumed", () => {
    expect(calculateRemainingCalories(2200, 1800)).toBe(400);
    expect(calculateRemainingCalories(2200, 2500)).toBe(-300);
  });

  it("aggregates daily trend points", () => {
    const aggregated = aggregateDailyTrendPoints([
      { caloriesCanonical: 1000, proteinG: 60, carbsG: 100, fatsG: 20 },
      { caloriesCanonical: 1200, proteinG: 70, carbsG: 120, fatsG: 30 },
    ]);

    expect(aggregated.caloriesCanonical).toBe(2200);
    expect(aggregated.proteinG).toBe(130);
    expect(aggregated.carbsG).toBe(220);
    expect(aggregated.fatsG).toBe(50);
  });
});
