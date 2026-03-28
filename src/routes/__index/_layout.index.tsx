import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateKey, formatNumber } from "@/lib/shared/utils";
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
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-white to-cyan-100 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Performance Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore movement progression and nutrition trends over time.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="dashboard-start-date" className="text-sm font-medium text-slate-700">
              Start Date
            </label>
            <Input
              id="dashboard-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="dashboard-end-date" className="text-sm font-medium text-slate-700">
              End Date
            </label>
            <Input
              id="dashboard-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
          <CardHeader>
            <CardTitle>Movement Progression</CardTitle>
            <p className="text-sm text-slate-600">
              Track maximum weight, total reps, or total volume for a selected movement.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="dashboard-movement" className="text-sm font-medium text-slate-700">
                  Movement
                </label>
                <Select
                  id="dashboard-movement"
                  value={effectiveMovementId}
                  onChange={(event) => setSelectedMovementId(event.target.value)}>
                  {movements.length === 0 ? <option value="">No movements yet</option> : null}
                  {movements.map((movement) => (
                    <option key={movement.id} value={movement.id}>
                      {movement.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="dashboard-movement-metric" className="text-sm font-medium text-slate-700">
                  Metric
                </label>
                <Select
                  id="dashboard-movement-metric"
                  value={movementMetric}
                  onChange={(event) => setMovementMetric(event.target.value as MovementMetric)}>
                  <option value="maxWeight">Maximum Weight</option>
                  <option value="totalReps">Total Reps</option>
                  <option value="totalVolume">Total Volume</option>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-blue-700">Latest Value</p>
              <p className="text-lg font-semibold text-slate-900">
                {latestMovementValue === null
                  ? "No data"
                  : `${formatNumber(latestMovementValue)} ${getMovementMetricUnit(movementMetric)}`}
              </p>
            </div>

            {movementChartData.length === 0 ? (
              <p className="text-sm text-slate-500">No movement data in this range. Log workouts to populate the chart.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={movementChartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="movementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                    <XAxis dataKey="axisDate" tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} width={70} />
                    <Tooltip
                      cursor={{ stroke: "#1d4ed8", strokeOpacity: 0.25 }}
                      contentStyle={{ borderRadius: 12, borderColor: "#bfdbfe" }}
                      formatter={(value) => {
                        const numeric = typeof value === "number" ? value : Number(value ?? 0);
                        return [formatNumber(numeric), getMovementMetricLabel(movementMetric)];
                      }}
                      labelFormatter={(_, payload) => {
                        const rawDate = payload?.[0]?.payload?.date;
                        return rawDate ? formatDateKey(String(rawDate)) : "";
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#1d4ed8" strokeWidth={2.5} fill="url(#movementGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm">
          <CardHeader>
            <CardTitle>Nutrition Trend</CardTitle>
            <p className="text-sm text-slate-600">
              Chart calories, macros, and bodyweight to spot nutrition patterns.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="dashboard-nutrition-metric" className="text-sm font-medium text-slate-700">
                Metric
              </label>
              <Select
                id="dashboard-nutrition-metric"
                value={nutritionMetric}
                onChange={(event) => setNutritionMetric(event.target.value as NutritionMetric)}>
                <option value="calories">Calories</option>
                <option value="protein">Protein (g)</option>
                <option value="carbs">Carbs (g)</option>
                <option value="fats">Fats (g)</option>
                <option value="bodyWeight">Bodyweight (kg)</option>
              </Select>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-white/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Latest Value</p>
              <p className="text-lg font-semibold text-slate-900">
                {latestNutritionValue === null
                  ? "No data"
                  : `${formatNumber(latestNutritionValue)} ${getNutritionMetricUnit(nutritionMetric)}`}
              </p>
            </div>

            {nutritionChartData.length === 0 ? (
              <p className="text-sm text-slate-500">No nutrition data in this range. Log meals and bodyweight to populate the chart.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={nutritionChartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="nutritionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                    <XAxis dataKey="axisDate" tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} width={70} />
                    <Tooltip
                      cursor={{ stroke: "#047857", strokeOpacity: 0.25 }}
                      contentStyle={{ borderRadius: 12, borderColor: "#a7f3d0" }}
                      formatter={(value) => {
                        const numeric = typeof value === "number" ? value : Number(value ?? 0);
                        return [formatNumber(numeric), getNutritionMetricLabel(nutritionMetric)];
                      }}
                      labelFormatter={(_, payload) => {
                        const rawDate = payload?.[0]?.payload?.date;
                        return rawDate ? formatDateKey(String(rawDate)) : "";
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#047857" strokeWidth={2.5} fill="url(#nutritionGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
