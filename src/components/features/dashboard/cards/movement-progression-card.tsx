import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDateKey, formatNumber } from "@/lib/shared/utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MovementMetric = "maxWeight" | "totalReps" | "totalVolume";

type MovementOption = {
  id: string;
  name: string;
};

type ChartPoint = {
  date: string;
  axisDate: string;
  value: number;
};

type MovementProgressionCardProps = {
  movementOptions: MovementOption[];
  selectedMovementId: string;
  movementMetric: MovementMetric;
  movementChartData: ChartPoint[];
  latestMovementValue: number | null;
  onMovementChange: (value: string) => void;
  onMetricChange: (value: MovementMetric) => void;
  getMovementMetricUnit: (metric: MovementMetric) => string;
  getMovementMetricLabel: (metric: MovementMetric) => string;
};

export function MovementProgressionCard({
  movementOptions,
  selectedMovementId,
  movementMetric,
  movementChartData,
  latestMovementValue,
  onMovementChange,
  onMetricChange,
  getMovementMetricUnit,
  getMovementMetricLabel,
}: Readonly<MovementProgressionCardProps>) {
  return (
    <Card className="border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
      <CardHeader>
        <CardTitle>Movement Progression</CardTitle>
        <p className="text-sm text-slate-600">Track maximum weight, total reps, or total volume for a selected movement.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="dashboard-movement" className="text-sm font-medium text-slate-700">
              Movement
            </label>
            <Select id="dashboard-movement" value={selectedMovementId} onChange={(event) => onMovementChange(event.target.value)}>
              {movementOptions.length === 0 ? <option value="">No movements yet</option> : null}
              {movementOptions.map((movement) => (
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
              onChange={(event) => onMetricChange(event.target.value as MovementMetric)}>
              <option value="maxWeight">Maximum Weight</option>
              <option value="totalReps">Total Reps</option>
              <option value="totalVolume">Total Volume</option>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-white/80 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-blue-700">Latest Value</p>
          <p className="text-lg font-semibold text-slate-900">
            {latestMovementValue === null ? "No data" : `${formatNumber(latestMovementValue)} ${getMovementMetricUnit(movementMetric)}`}
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
  );
}
