import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { nutritionDailyLogQueryOptions, nutritionDefaultsQueryOptions } from "../-queries/nutrition";
import { CaloriesMacrosOverview } from "@/components/features/nutrition";

export const Route = createFileRoute("/__index/_layout/nutrition/calories-macros/")({
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
    <CaloriesMacrosOverview
      selectedDate={selectedDate}
      totals={dailyQuery.data.totals}
      goalContext={dailyQuery.data.goalContext}
      onDateChange={setSelectedDate}
    />
  );
}
