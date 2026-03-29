import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDurationSeconds, formatWeight } from "@/lib/shared/utils";

type CompletionSummary = {
  durationSeconds: number;
  totalVolumeKg: number;
};

type LatestCompletionSummaryCardProps = {
  summary: CompletionSummary;
};

export function LatestCompletionSummaryCard({ summary }: Readonly<LatestCompletionSummaryCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Completion Summary</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-700">
        Duration: {formatDurationSeconds(summary.durationSeconds)}. Total volume: {" "}
        {formatWeight(summary.totalVolumeKg, "kg")}
      </CardContent>
    </Card>
  );
}
