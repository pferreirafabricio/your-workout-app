import { ArrowDown, ArrowUp, Check, CircleDot, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QueueItem = {
  id: string;
  movementId: string;
  targetSets: number;
  isSkipped: boolean;
  movement: { name: string };
};

type QueueModeCardProps = {
  queue: QueueItem[];
  activeMovementId: string | null;
  setCountsByMovementId: Map<string, number>;
  queueMutationIsPending: boolean;
  onDecreaseTargetSets: (movementId: string, targetSets: number) => void;
  onIncreaseTargetSets: (movementId: string, targetSets: number) => void;
  onMoveUp: (movementId: string) => void;
  onMoveDown: (movementId: string) => void;
  onActivate: (movementId: string) => void;
  onToggleSkip: (movementId: string, isSkipped: boolean) => void;
};

export function QueueModeCard({
  queue,
  activeMovementId,
  setCountsByMovementId,
  queueMutationIsPending,
  onDecreaseTargetSets,
  onIncreaseTargetSets,
  onMoveUp,
  onMoveDown,
  onActivate,
  onToggleSkip,
}: Readonly<QueueModeCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDot className="h-4 w-4" />
          Queue Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500">No queued movements yet. Create a movement to begin.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((queueItem, index) => {
              const isActive = activeMovementId === queueItem.movementId;
              const completedSets = setCountsByMovementId.get(queueItem.movementId) ?? 0;
              const isCompleted = completedSets >= queueItem.targetSets && !queueItem.isSkipped;
              let activateButtonLabel = "Set Active";
              if (queueMutationIsPending) {
                activateButtonLabel = "loading...";
              } else if (isActive) {
                activateButtonLabel = "Active";
              }

              let skipButtonLabel = "Skip";
              if (queueMutationIsPending) {
                skipButtonLabel = "loading...";
              } else if (queueItem.isSkipped) {
                skipButtonLabel = "Unskip";
              }

              return (
                <li
                  key={queueItem.id}
                  className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                    isActive ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"
                  }`}>
                  <div>
                    <p className={`font-medium ${queueItem.isSkipped ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {index + 1}. {queueItem.movement.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {completedSets}/{queueItem.targetSets} sets
                    </p>
                    {isActive ? <p className="text-xs text-teal-700">Active movement</p> : null}
                    {isCompleted ? (
                      <p className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Completed
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDecreaseTargetSets(queueItem.movementId, queueItem.targetSets)}
                      disabled={queueMutationIsPending || queueItem.targetSets <= 1}
                      aria-label="Decrease target sets">
                      {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onIncreaseTargetSets(queueItem.movementId, queueItem.targetSets)}
                      disabled={queueMutationIsPending || queueItem.targetSets >= 12}
                      aria-label="Increase target sets">
                      {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMoveUp(queueItem.movementId)}
                      disabled={queueMutationIsPending || index === 0}
                      aria-label="Move up">
                      {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMoveDown(queueItem.movementId)}
                      disabled={queueMutationIsPending || index === queue.length - 1}
                      aria-label="Move down">
                      {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => onActivate(queueItem.movementId)}
                      disabled={queueMutationIsPending || isActive}>
                      {activateButtonLabel}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleSkip(queueItem.movementId, queueItem.isSkipped)}
                      disabled={queueMutationIsPending}>
                      {skipButtonLabel}
                    </Button>
                    {queueMutationIsPending ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500" aria-live="polite">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        loading...
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
