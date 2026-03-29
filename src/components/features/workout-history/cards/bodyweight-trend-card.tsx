import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatWeight } from "@/lib/shared/utils";

type BodyWeightPoint = {
  date: string | Date;
  weight: number;
  weightUnit: "kg" | "lbs";
};

type BodyweightTrendCardProps = {
  bodyWeightSeries: BodyWeightPoint[];
  timeZone: string;
};

export function BodyweightTrendCard({ bodyWeightSeries, timeZone }: Readonly<BodyweightTrendCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bodyweight Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {bodyWeightSeries.length === 0 ? (
          <p className="text-sm text-slate-500">No bodyweight entries yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {bodyWeightSeries.map((point) => (
              <li key={`${point.date}-${point.weight}`} className="bg-slate-50 rounded-lg px-3 py-2 flex justify-between">
                <span>{formatDateTime(point.date, { timeZone })}</span>
                <span className="font-medium">{formatWeight(point.weight, point.weightUnit)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
