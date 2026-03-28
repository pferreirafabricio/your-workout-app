import { describe, expect, it } from "vitest";
import { mapNutritionSeriesToChart, mapProgressionSeriesToChart } from "./series-mappers";
import { canQueryDateRange, normalizeDateRange } from "./date-range";

describe("dashboard series mappers", () => {
  it("maps progression points into chart points", () => {
    const result = mapProgressionSeriesToChart([
      { date: "2026-03-26", value: 100 },
      { date: "2026-03-27", value: 110 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: "2026-03-26", value: 100 });
    expect(result[1]).toMatchObject({ date: "2026-03-27", value: 110 });
  });

  it("maps nutrition points and filters null bodyweight values", () => {
    const result = mapNutritionSeriesToChart(
      [
        {
          localDate: "2026-03-26",
          caloriesCanonical: 2000,
          proteinG: 150,
          carbsG: 210,
          fatsG: 70,
          bodyWeight: 81.4,
        },
        {
          localDate: "2026-03-27",
          caloriesCanonical: 2100,
          proteinG: 155,
          carbsG: 225,
          fatsG: 75,
          bodyWeight: null,
        },
      ],
      "bodyWeight",
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ date: "2026-03-26", value: 81.4 });
  });
});

describe("dashboard date range utilities", () => {
  it("normalizes inverted date ranges", () => {
    const normalized = normalizeDateRange({ startDate: "2026-03-28", endDate: "2026-03-20" });
    expect(normalized).toEqual({ startDate: "2026-03-20", endDate: "2026-03-28" });
  });

  it("validates queryable date ranges", () => {
    expect(canQueryDateRange({ startDate: "2026-03-20", endDate: "2026-03-28" })).toBe(true);
    expect(canQueryDateRange({ startDate: "2026-03-28", endDate: "2026-03-20" })).toBe(false);
    expect(canQueryDateRange({ startDate: "", endDate: "2026-03-20" })).toBe(false);
  });
});
