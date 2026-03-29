import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDateKey, formatNumber } from "@/lib/shared/utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type NutritionMetric = "calories" | "protein" | "carbs" | "fats" | "bodyWeight";

type ChartPoint = {
  date: string;
  value: number;
};

type NutritionTrendCardProps = {
  nutritionMetric: NutritionMetric;
  nutritionChartData: ChartPoint[];
  latestNutritionValue: number | null;
  onMetricChange: (value: NutritionMetric) => void;
  getNutritionMetricUnit: (metric: NutritionMetric) => string;
  getNutritionMetricLabel: (metric: NutritionMetric) => string;
};

export function NutritionTrendCard({
  nutritionMetric,
  nutritionChartData,
  latestNutritionValue,
  onMetricChange,
  getNutritionMetricUnit,
  getNutritionMetricLabel,
}: Readonly<NutritionTrendCardProps>) {
  return (
    <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm">
      <CardHeader>
        <CardTitle>Nutrition Trend</CardTitle>
        <p className="text-sm text-slate-600">Chart calories, macros, and bodyweight to spot nutrition patterns.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="dashboard-nutrition-metric" className="text-sm font-medium text-slate-700">
            Metric
          </label>
          <Select
            id="dashboard-nutrition-metric"
            value={nutritionMetric}
            onChange={(event) => onMetricChange(event.target.value as NutritionMetric)}>
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
            {latestNutritionValue === null ? "No data" : `${formatNumber(latestNutritionValue)} ${getNutritionMetricUnit(nutritionMetric)}`}
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
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#475569", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={(value) =>
                    typeof value === "string"
                      ? formatDateKey(value, { formatOptions: { month: "short", day: "numeric" } })
                      : ""
                  }
                />
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
  );
}
