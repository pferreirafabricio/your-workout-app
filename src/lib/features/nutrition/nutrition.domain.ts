export type NutritionMacros = {
  proteinG: number;
  carbsG: number;
  fatsG: number;
};

export function calculateCanonicalCalories(macros: NutritionMacros): number {
  return round2(macros.proteinG * 4 + macros.carbsG * 4 + macros.fatsG * 9);
}

export function calculateMacroPercentages(macros: NutritionMacros): {
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
} {
  const calories = calculateCanonicalCalories(macros);
  if (calories <= 0) {
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  }

  const proteinPct = round2(((macros.proteinG * 4) / calories) * 100);
  const carbsPct = round2(((macros.carbsG * 4) / calories) * 100);
  const fatsPct = round2(((macros.fatsG * 9) / calories) * 100);

  return { proteinPct, carbsPct, fatsPct };
}

export function hasCalorieMismatch(caloriesEntered: number, caloriesCanonical: number): boolean {
  return round2(caloriesEntered) !== round2(caloriesCanonical);
}

export function computeBalanceLabel(balanceCalories: number): "SURPLUS" | "DEFICIT" | "ON_TARGET" {
  if (balanceCalories > 0) {
    return "SURPLUS";
  }
  if (balanceCalories < 0) {
    return "DEFICIT";
  }
  return "ON_TARGET";
}

export function calculateRemainingCalories(calorieTarget: number, caloriesCanonical: number): number {
  return round2(calorieTarget - caloriesCanonical);
}

export function aggregateDailyTrendPoints(
  points: Array<{ proteinG: number; carbsG: number; fatsG: number; caloriesCanonical: number }>,
): {
  caloriesCanonical: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
} {
  return points.reduce(
    (acc, point) => {
      acc.caloriesCanonical += point.caloriesCanonical;
      acc.proteinG += point.proteinG;
      acc.carbsG += point.carbsG;
      acc.fatsG += point.fatsG;
      return acc;
    },
    {
      caloriesCanonical: 0,
      proteinG: 0,
      carbsG: 0,
      fatsG: 0,
    },
  );
}

export function getLocalDateString(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function dateToLocalDateString(date: Date, timeZone: string): string {
  return getLocalDateString(date, timeZone);
}

export function defaultHistoryRange(timeZone: string): { startDate: string; endDate: string } {
  const endDate = getLocalDateString(new Date(), timeZone);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() - 13);
  const startDate = end.toISOString().slice(0, 10);
  return { startDate, endDate };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
