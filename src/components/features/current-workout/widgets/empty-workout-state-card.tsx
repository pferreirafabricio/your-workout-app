import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDurationSeconds, formatWeight } from "@/lib/shared/utils";

type CompletionSummary = {
  durationSeconds: number;
  totalVolumeKg: number;
};

type EmptyWorkoutStateCardProps = {
  isStarting: boolean;
  completionSummary: CompletionSummary | null;
  onStartWorkout: () => void;
};

export function EmptyWorkoutStateCard({
  isStarting,
  completionSummary,
  onStartWorkout,
}: Readonly<EmptyWorkoutStateCardProps>) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-slate-500 mb-4">No active workout. Ready to start?</p>
        <Button onClick={onStartWorkout} size="lg">
          <Play className="w-4 h-4 mr-2" />
          {isStarting ? "Starting..." : "Start Workout"}
        </Button>
        {completionSummary && (
          <p className="text-sm text-emerald-700 mt-4">
            Last workout: {formatDurationSeconds(completionSummary.durationSeconds)}, {" "}
            {formatWeight(completionSummary.totalVolumeKg, "kg")} total volume.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
