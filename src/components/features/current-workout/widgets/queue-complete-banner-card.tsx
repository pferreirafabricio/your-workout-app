import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type QueueCompleteBannerCardProps = {
  isCompleting: boolean;
  onFinishWorkout: () => void;
};

export function QueueCompleteBannerCard({ isCompleting, onFinishWorkout }: Readonly<QueueCompleteBannerCardProps>) {
  return (
    <Card>
      <CardContent className="py-3 flex items-center justify-between gap-3">
        <p className="text-sm text-emerald-700 font-medium">You hit all queue targets. You can complete this workout now.</p>
        <Button size="sm" onClick={onFinishWorkout} disabled={isCompleting}>
          <Check className="h-4 w-4 mr-2" />
          Finish Workout
        </Button>
      </CardContent>
    </Card>
  );
}
