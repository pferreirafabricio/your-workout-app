import { Dumbbell, Scale, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDateKey, formatNumber } from "@/lib/shared/utils";

type Metric = "maxWeight" | "totalReps" | "totalVolume";
type MovementTuple = [string, string];

type SeriesPoint = {
  date: string;
  value: number;
};

type ProgressionInsightsCardProps = {
  uniqueMovements: MovementTuple[];
  selectedMovementId: string;
  selectedMetric: Metric;
  onMovementChange: (movementId: string) => void;
  onMetricChange: (metric: Metric) => void;
  hasMovementSelected: boolean;
  hasProgressionPoints: boolean;
  progressionItems: SeriesPoint[];
  latestProgressionPoint: SeriesPoint | null;
  bestProgressionPoint: SeriesPoint | null;
  progressionDeltaLabel: string;
};

export function ProgressionInsightsCard({
  uniqueMovements,
  selectedMovementId,
  selectedMetric,
  onMovementChange,
  onMetricChange,
  hasMovementSelected,
  hasProgressionPoints,
  progressionItems,
  latestProgressionPoint,
  bestProgressionPoint,
  progressionDeltaLabel,
}: Readonly<ProgressionInsightsCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="progression-movement">
              Movement
            </label>
            <Select
              id="progression-movement"
              value={selectedMovementId}
              onChange={(event) => onMovementChange(event.target.value)}>
              <option value="">Select movement</option>
              {uniqueMovements.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="progression-metric">
              Metric
            </label>
            <Select
              id="progression-metric"
              value={selectedMetric}
              onChange={(event) => onMetricChange(event.target.value as Metric)}>
              <option value="maxWeight">Max Weight</option>
              <option value="totalReps">Total Reps</option>
              <option value="totalVolume">Total Volume</option>
            </Select>
          </div>
        </div>

        {!hasMovementSelected && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Select a movement to reveal progression cards and trend points.
          </div>
        )}
        {hasMovementSelected && !hasProgressionPoints && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No progression points for this movement and metric yet.
          </div>
        )}
        {hasMovementSelected && hasProgressionPoints && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium uppercase tracking-wide">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Latest
                </div>
                <p className="mt-2 text-2xl font-semibold text-emerald-900">{formatNumber(latestProgressionPoint?.value ?? 0)}</p>
                <p className="mt-1 text-xs text-emerald-700">{formatDateKey(latestProgressionPoint?.date ?? "")}</p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700 text-xs font-medium uppercase tracking-wide">
                  <Scale className="h-3.5 w-3.5" />
                  Best
                </div>
                <p className="mt-2 text-2xl font-semibold text-blue-900">{formatNumber(bestProgressionPoint?.value ?? 0)}</p>
                <p className="mt-1 text-xs text-blue-700">{formatDateKey(bestProgressionPoint?.date ?? "")}</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-medium uppercase tracking-wide">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Delta vs previous
                </div>
                <p className="mt-2 text-2xl font-semibold text-amber-900">{progressionDeltaLabel}</p>
                <p className="mt-1 text-xs text-amber-700">{progressionItems.length} points logged</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {progressionItems.map((point, index) => {
                const isLatest = index === progressionItems.length - 1;
                return (
                  <div
                    key={`${point.date}-${point.value}`}
                    className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                      isLatest ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                    }`}>
                    <span className="text-slate-600">{formatDateKey(point.date)}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(point.value)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
