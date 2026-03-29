import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  getMovementMetricLabel,
  getMovementMetricUnit,
  getNutritionMetricLabel,
  getNutritionMetricUnit,
  type MovementMetric,
  type NutritionMetric,
} from "./-dashboard/metrics";
import {
  mapNutritionSeriesToChart,
  mapProgressionSeriesToChart,
  type NutritionPoint,
  type ProgressionPoint,
} from "./-dashboard/series-mappers";
import { canQueryDateRange, normalizeDateRange } from "./-dashboard/date-range";
import {
  movementsQueryOptions,
  nutritionDefaultsQueryOptions,
  nutritionHistoryQueryOptions,
  progressionSeriesQueryOptions,
} from "./-dashboard/queries";
import {
  DashboardHeaderCard,
  MovementProgressionCard,
  NutritionTrendCard,
} from "@/components/features/dashboard";

type Movement = {
  id: string;
  name: string;
};

export const Route = createFileRoute("/__index/_layout/")({
  loader: async ({ context }) => {
    const defaults = await context.queryClient.ensureQueryData(nutritionDefaultsQueryOptions());

    await Promise.all([
      context.queryClient.ensureQueryData(movementsQueryOptions()),
      context.queryClient.ensureQueryData(
        nutritionHistoryQueryOptions(defaults.historyRange.startDate, defaults.historyRange.endDate),
      ),
    ]);
  },
  component: HomeDashboardPage,
});

export function HomeDashboardPage() {
  const { data: defaults } = useSuspenseQuery(nutritionDefaultsQueryOptions());
  const { data: movementsData } = useSuspenseQuery(movementsQueryOptions());
  const movements = movementsData as Movement[];

  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [movementMetric, setMovementMetric] = useState<MovementMetric>("maxWeight");
  const [nutritionMetric, setNutritionMetric] = useState<NutritionMetric>("calories");
  const [startDate, setStartDate] = useState(defaults.historyRange.startDate);
  const [endDate, setEndDate] = useState(defaults.historyRange.endDate);

  const normalizedRange = normalizeDateRange({ startDate, endDate });
  const isRangeQueryable = canQueryDateRange(normalizedRange);
  const effectiveMovementId = selectedMovementId || movements[0]?.id || "";

  const progressionQuery = useQuery(
    progressionSeriesQueryOptions(
      effectiveMovementId,
      movementMetric,
      normalizedRange.startDate,
      normalizedRange.endDate,
      isRangeQueryable,
    ),
  );

  const nutritionQuery = useQuery(
    nutritionHistoryQueryOptions(normalizedRange.startDate, normalizedRange.endDate, isRangeQueryable),
  );

  const progressionSeries = (progressionQuery.data ?? []) as ProgressionPoint[];
  const nutritionPoints = (nutritionQuery.data?.points ?? []) as NutritionPoint[];

  const movementChartData = useMemo(() => mapProgressionSeriesToChart(progressionSeries), [progressionSeries]);

  const nutritionChartData = useMemo(
    () => mapNutritionSeriesToChart(nutritionPoints, nutritionMetric),
    [nutritionMetric, nutritionPoints],
  );

  const latestMovementValue = movementChartData.at(-1)?.value ?? null;
  const latestNutritionValue = nutritionChartData.at(-1)?.value ?? null;

  return (
    <div className="space-y-6">
      <DashboardHeaderCard
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MovementProgressionCard
          movementOptions={movements}
          selectedMovementId={effectiveMovementId}
          movementMetric={movementMetric}
          movementChartData={movementChartData}
          latestMovementValue={latestMovementValue}
          onMovementChange={setSelectedMovementId}
          onMetricChange={setMovementMetric}
          getMovementMetricUnit={getMovementMetricUnit}
          getMovementMetricLabel={getMovementMetricLabel}
        />

        <NutritionTrendCard
          nutritionMetric={nutritionMetric}
          nutritionChartData={nutritionChartData}
          latestNutritionValue={latestNutritionValue}
          onMetricChange={setNutritionMetric}
          getNutritionMetricUnit={getNutritionMetricUnit}
          getNutritionMetricLabel={getNutritionMetricLabel}
        />
      </div>
    </div>
  );
}
