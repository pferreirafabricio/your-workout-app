import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { nutritionDailyLogQueryOptions, nutritionDefaultsQueryOptions } from "./_layout.nutrition/-queries/nutrition";

export const Route = createFileRoute("/__index/_layout/nutrition/calories-macros")({
  loader: async ({ context }) => {
    const defaults = await context.queryClient.ensureQueryData(nutritionDefaultsQueryOptions());
    await context.queryClient.ensureQueryData(nutritionDailyLogQueryOptions(defaults.today));
  },
  component: NutritionCaloriesMacrosPage,
});

function NutritionCaloriesMacrosPage() {
  const { data: defaults } = useSuspenseQuery(nutritionDefaultsQueryOptions());
  const [selectedDate, setSelectedDate] = useState(defaults.today);
  const dailyQuery = useSuspenseQuery(nutritionDailyLogQueryOptions(selectedDate));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Calories & Macros</h1>

      <Card>
        <CardHeader>
          <CardTitle>Date Selection</CardTitle>
        </CardHeader>
        <CardContent className="max-w-sm">
          <label className="text-sm font-medium text-slate-700" htmlFor="summary-date">
            Selected Date
          </label>
          <Input id="summary-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Consumed Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.totals.caloriesCanonical} kcal</p>
            <p className="text-sm text-slate-500 mt-1">Canonical from macros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entered Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.totals.caloriesEntered} kcal</p>
            <p className="text-sm text-slate-500 mt-1">Manual values from entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyQuery.data.goalContext.hasGoals ? (
              <>
                <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.goalContext.balanceCalories} kcal</p>
                <p className="text-sm text-slate-500 mt-1">{dailyQuery.data.goalContext.balanceLabel}</p>
              </>
            ) : (
              <p className="text-sm text-amber-700">Set nutrition goals in Settings to view balance.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyQuery.data.goalContext.hasGoals ? (
              <>
                <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.goalContext.remainingCalories} kcal</p>
                <p className="text-sm text-slate-500 mt-1">Against your daily target</p>
              </>
            ) : (
              <p className="text-sm text-amber-700">Set nutrition goals in Settings to view remaining calories.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.totals.proteinG} g</p>
            <p className="text-sm text-slate-500 mt-1">{dailyQuery.data.totals.proteinPct}% of calories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.totals.carbsG} g</p>
            <p className="text-sm text-slate-500 mt-1">{dailyQuery.data.totals.carbsPct}% of calories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{dailyQuery.data.totals.fatsG} g</p>
            <p className="text-sm text-slate-500 mt-1">{dailyQuery.data.totals.fatsPct}% of calories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
