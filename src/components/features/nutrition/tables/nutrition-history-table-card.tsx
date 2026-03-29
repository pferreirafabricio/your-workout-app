import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type HistoryPoint = {
  localDate: string;
  caloriesCanonical: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  bodyWeight: number | null;
};

type NutritionHistoryTableCardProps = {
  historyStart: string;
  historyEnd: string;
  includeBodyWeight: boolean;
  historyPoints: HistoryPoint[];
  isFetching: boolean;
  onHistoryStartChange: (value: string) => void;
  onHistoryEndChange: (value: string) => void;
  onIncludeBodyWeightChange: (value: boolean) => void;
  onRefresh: () => void;
};

export function NutritionHistoryTableCard({
  historyStart,
  historyEnd,
  includeBodyWeight,
  historyPoints,
  isFetching,
  onHistoryStartChange,
  onHistoryEndChange,
  onIncludeBodyWeightChange,
  onRefresh,
}: Readonly<NutritionHistoryTableCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>History Table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="history-start">
              Start Date
            </label>
            <Input id="history-start" type="date" value={historyStart} onChange={(event) => onHistoryStartChange(event.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="history-end">
              End Date
            </label>
            <Input id="history-end" type="date" value={historyEnd} onChange={(event) => onHistoryEndChange(event.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={includeBodyWeight} onChange={(event) => onIncludeBodyWeightChange(event.target.checked)} />
            <span>Include body weight</span>
          </label>
          <Button type="button" variant="outline" onClick={onRefresh} disabled={isFetching}>
            {isFetching ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {isFetching ? <p className="text-sm text-slate-500">Loading history data...</p> : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Calories</th>
                <th className="px-3 py-2 text-left">Protein (g)</th>
                <th className="px-3 py-2 text-left">Carbs (g)</th>
                <th className="px-3 py-2 text-left">Fats (g)</th>
                <th className="px-3 py-2 text-left">Bodyweight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {historyPoints.map((point) => (
                <tr key={point.localDate} className="border-t border-slate-200">
                  <td className="px-3 py-2">{point.localDate}</td>
                  <td className="px-3 py-2">{point.caloriesCanonical}</td>
                  <td className="px-3 py-2">{point.proteinG}</td>
                  <td className="px-3 py-2">{point.carbsG}</td>
                  <td className="px-3 py-2">{point.fatsG}</td>
                  <td className="px-3 py-2">{includeBodyWeight ? (point.bodyWeight ?? "-") : "hidden"}</td>
                </tr>
              ))}
              {historyPoints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-slate-500">
                    No historical data in this range.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
