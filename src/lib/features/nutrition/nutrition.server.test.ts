import { describe, expect, it } from "vitest";
import {
  createNutritionFoodEntryServerFn,
  deleteNutritionFoodEntryServerFn,
  getNutritionDailyLogServerFn,
  getNutritionHistoryServerFn,
  upsertNutritionGoalsServerFn,
  updateNutritionFoodEntryServerFn,
} from "@/lib/features/nutrition/nutrition.server";

describe("nutrition server", () => {
  it("exposes daily log endpoint", async () => {
    await expect(getNutritionDailyLogServerFn({ data: {} })).rejects.toThrow();
  });

  it("rejects invalid create payload", async () => {
    await expect(
      createNutritionFoodEntryServerFn({
        data: {
          localDate: "invalid-date",
          name: "",
          quantity: -1,
          quantityUnit: "GRAMS",
          proteinG: -1,
          carbsG: -1,
          fatsG: -1,
          caloriesEntered: -1,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid update payload", async () => {
    await expect(updateNutritionFoodEntryServerFn({ data: { entryId: "" } })).rejects.toThrow();
  });

  it("rejects invalid delete payload", async () => {
    await expect(deleteNutritionFoodEntryServerFn({ data: { entryId: "" } })).rejects.toThrow();
  });

  it("rejects invalid goals payload", async () => {
    await expect(
      upsertNutritionGoalsServerFn({
        data: {
          calorieTarget: -1,
          proteinTargetG: -1,
          carbsTargetG: -1,
          fatsTargetG: -1,
          goalType: "CUT",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid history payload", async () => {
    await expect(
      getNutritionHistoryServerFn({
        data: {
          startDate: "2026-03-10",
          endDate: "2026-03-01",
          includeBodyWeight: true,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects create mutation without auth/csrf context", async () => {
    await expect(
      createNutritionFoodEntryServerFn({
        data: {
          localDate: "2026-03-28",
          name: "Chicken breast",
          quantity: 150,
          quantityUnit: "GRAMS",
          proteinG: 35,
          carbsG: 0,
          fatsG: 5,
          caloriesEntered: 250,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects update mutation without auth/csrf context", async () => {
    await expect(
      updateNutritionFoodEntryServerFn({
        data: {
          entryId: "entry-id",
          caloriesEntered: 200,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects delete mutation without auth/csrf context", async () => {
    await expect(
      deleteNutritionFoodEntryServerFn({
        data: {
          entryId: "entry-id",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects goals mutation without auth/csrf context", async () => {
    await expect(
      upsertNutritionGoalsServerFn({
        data: {
          calorieTarget: 2200,
          proteinTargetG: 180,
          carbsTargetG: 220,
          fatsTargetG: 70,
          goalType: "MAINTENANCE",
        },
      }),
    ).rejects.toThrow();
  });

  it.todo("adds integration coverage for food-entry lifecycle and total recomputation");
  it.todo("adds integration coverage for goals-dependent summary visibility");
});
