import { describe, expect, it } from "vitest";
import {
  createNutritionFoodEntryInputSchema,
  getNutritionHistoryInputSchema,
  localDateSchema,
  updateNutritionFoodEntryInputSchema,
} from "@/lib/features/nutrition/nutrition.validation";

describe("nutrition validation", () => {
  it("accepts local-date format", () => {
    expect(localDateSchema.safeParse("2026-03-29").success).toBe(true);
  });

  it("rejects invalid local-date format", () => {
    expect(localDateSchema.safeParse("03/29/2026").success).toBe(false);
  });

  it("validates create nutrition entry payload", () => {
    const parsed = createNutritionFoodEntryInputSchema.safeParse({
      localDate: "2026-03-29",
      name: "Greek Yogurt",
      quantity: 200,
      quantityUnit: "GRAMS",
      proteinG: 20,
      carbsG: 8,
      fatsG: 5,
      caloriesEntered: 165,
    });

    expect(parsed.success).toBe(true);
  });

  it("requires at least one update field", () => {
    const parsed = updateNutritionFoodEntryInputSchema.safeParse({
      entryId: "entry-id",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires history end date >= start date", () => {
    const parsed = getNutritionHistoryInputSchema.safeParse({
      startDate: "2026-03-29",
      endDate: "2026-03-01",
      includeBodyWeight: true,
    });

    expect(parsed.success).toBe(false);
  });
});
