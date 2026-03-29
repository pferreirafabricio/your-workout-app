import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  activateWorkoutQueueMovementServerFn,
  createWorkoutServerFn,
  completeWorkoutServerFn,
  addSetServerFn,
  moveWorkoutQueueItemServerFn,
  setWorkoutQueueItemSkippedServerFn,
  setWorkoutQueueItemTargetSetsServerFn,
  updateSetServerFn,
  deleteSetServerFn,
} from "@/lib/features/workouts/workouts.server";
import { Check, X } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bodyWeightSeriesQueryOptions,
  currentWorkoutQueryOptions,
  movementsQueryOptions,
  userPreferencesQueryOptions,
} from "./-queries/current-workout";
import { addSetInputSchema, updateSetInputSchema } from "@/lib/features/workouts/workouts.validation";
import { formatDate } from "@/lib/shared/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { toast } from "sonner";
import {
  AddSetForm,
  EmptyWorkoutStateCard,
  LatestCompletionSummaryCard,
  QueueModeCard,
  QueueCompleteBannerCard,
  RestTimerCard,
  WorkoutSetsList,
} from "@/components/features/current-workout";

export const Route = createFileRoute("/__index/_layout/current-workout/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(currentWorkoutQueryOptions()),
      context.queryClient.ensureQueryData(movementsQueryOptions()),
      context.queryClient.ensureQueryData(userPreferencesQueryOptions()),
      context.queryClient.ensureQueryData(bodyWeightSeriesQueryOptions()),
    ]);
  },
  component: CurrentWorkoutPage,
});

function CurrentWorkoutPage() {
  const queryClient = useQueryClient();
  const { data: workout } = useSuspenseQuery(currentWorkoutQueryOptions());
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const { data: preferences } = useSuspenseQuery(userPreferencesQueryOptions());
  const { data: bodyWeightSeries } = useSuspenseQuery(bodyWeightSeriesQueryOptions());
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [pendingDeleteSetId, setPendingDeleteSetId] = useState<string | null>(null);
  const [setFormError, setSetFormError] = useState("");
  const [completionSummary, setCompletionSummary] = useState<{
    durationSeconds: number;
    totalVolumeKg: number;
  } | null>(null);

  const addSetForm = useForm({
    defaultValues: {
      selectedMovement: "",
      reps: "",
      weight: "",
      rpe: "",
      notes: "",
    },
    onSubmit: ({ value }) => {
      const parsedReps = Number(value.reps);
      const parsedWeight = value.weight.trim() === "" ? undefined : Number(value.weight);
      const parsedRpe = value.rpe.trim() === "" ? undefined : Number(value.rpe);

      if (isSelectedMovementBodyweight && !bodyWeightSeries.length && parsedWeight === undefined) {
        const message = "Record bodyweight first before adding a bodyweight set.";
        setSetFormError(message);
        toast.error(message);
        return;
      }

      const parsed = addSetInputSchema.safeParse({
        movementId: value.selectedMovement,
        reps: parsedReps,
        weight: parsedWeight,
        rpe: parsedRpe,
        notes: value.notes.trim() || undefined,
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid set values.";
        setSetFormError(message);
        toast.error(message);
        return;
      }

      addSetMutation.mutate(parsed.data);
    },
  });
  const addSetValues = useStore(addSetForm.store, (state) => state.values);

  const applyMovementSelection = (movementId: string) => {
    addSetForm.setFieldValue("selectedMovement", movementId);
    setSetFormError("");

    const movement = movements.find((item: { id: string; type: string }) => item.id === movementId);
    if (movement?.type === "BODYWEIGHT") {
      if (latestBodyWeight) {
        addSetForm.setFieldValue("weight", String(latestBodyWeight.weight));
      } else {
        addSetForm.setFieldValue("weight", "");
      }
      return;
    }

    addSetForm.setFieldValue("weight", "");
  };

  const selectedMovementRecord = movements.find(
    (movement: { id: string; type: string }) => movement.id === addSetValues.selectedMovement,
  );
  const isSelectedMovementBodyweight = selectedMovementRecord?.type === "BODYWEIGHT";
  const latestBodyWeight = bodyWeightSeries.at(-1) ?? null;

  const createWorkoutMutation = useMutation({
    mutationFn: () => createWorkoutServerFn({ headers: getCsrfHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      toast.success("Workout started.");
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: () => completeWorkoutServerFn({ headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (response.success) {
        setCompletionSummary({
          durationSeconds: response.summary.durationSeconds,
          totalVolumeKg: response.summary.totalVolumeKg,
        });
        toast.success("Workout completed.");
      } else {
        toast.error(response.error ?? "Unable to complete workout.");
      }
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
    },
  });

  const addSetMutation = useMutation({
    mutationFn: (data: {
      movementId: string;
      reps: number;
      weight?: number;
      rpe?: number | null;
      notes?: string | null;
      loggedAt?: string;
    }) =>
      addSetServerFn({ data, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.error ?? "Unable to save set.";
        setSetFormError(message);
        toast.error(message);
        return;
      }

      const nextSetCounts = new Map<string, number>();
      for (const set of workout?.sets ?? []) {
        nextSetCounts.set(set.movementId, (nextSetCounts.get(set.movementId) ?? 0) + 1);
      }
      nextSetCounts.set(response.set.movementId, (nextSetCounts.get(response.set.movementId) ?? 0) + 1);

      const nextQueueMovement = (workout?.queue ?? []).find((queueItem: {
        movementId: string;
        isSkipped: boolean;
        targetSets: number;
      }) => {
        if (queueItem.isSkipped) {
          return false;
        }
        const completedSets = nextSetCounts.get(queueItem.movementId) ?? 0;
        return completedSets < queueItem.targetSets;
      });

      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      addSetForm.setFieldValue("reps", "");
      addSetForm.setFieldValue("weight", "");
      addSetForm.setFieldValue("rpe", "");
      addSetForm.setFieldValue("notes", "");
      setSetFormError("");

      if (nextQueueMovement) {
        applyMovementSelection(nextQueueMovement.movementId);
        if (workout?.activeMovementId !== nextQueueMovement.movementId) {
          activateQueueMovementMutation.mutate(nextQueueMovement.movementId);
        }
      }

      toast.success("Set added.");
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: (data: {
      setId: string;
      reps?: number;
      weight?: number;
      rpe?: number | null;
      notes?: string | null;
      expectedVersion?: number;
    }) => updateSetServerFn({ data, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.error ?? "Unable to update set.";
        setSetFormError(message);
        toast.error(message);
        return;
      }

      if (response.replacementNotice) {
        setSetFormError(response.replacementNotice.message);
        toast.warning(response.replacementNotice.message);
      } else {
        toast.success("Set updated.");
      }

      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      setEditingSetId(null);
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) => deleteSetServerFn({ data: { setId }, headers: getCsrfHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      toast.success("Set deleted.");
    },
  });

  const moveQueueItemMutation = useMutation({
    mutationFn: (data: { movementId: string; direction: "up" | "down" }) =>
      moveWorkoutQueueItemServerFn({ data, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.error ?? "Unable to move queue item.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const setQueueItemSkippedMutation = useMutation({
    mutationFn: (data: { movementId: string; skipped: boolean }) =>
      setWorkoutQueueItemSkippedServerFn({ data, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.error ?? "Unable to update queue item.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const activateQueueMovementMutation = useMutation({
    mutationFn: (movementId: string) =>
      activateWorkoutQueueMovementServerFn({ data: { movementId }, headers: getCsrfHeaders() }),
    onSuccess: (response, movementId) => {
      if (!response.success) {
        toast.error(response.error ?? "Unable to activate movement.");
        return;
      }
      applyMovementSelection(movementId);
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const setQueueTargetSetsMutation = useMutation({
    mutationFn: (data: { movementId: string; targetSets: number }) =>
      setWorkoutQueueItemTargetSetsServerFn({ data, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.error ?? "Unable to update target sets.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  useEffect(() => {
    if (!workout) {
      return;
    }

    if (!addSetValues.selectedMovement && workout.activeMovementId) {
      applyMovementSelection(workout.activeMovementId);
    }
  }, [addSetValues.selectedMovement, workout]);

  const handleInlineSave = (setId: string, version: number) => {
    const parsedReps = Number(reps);
    const parsedWeight = weight.trim() === "" ? undefined : Number(weight);
    const parsedRpe = rpe.trim() === "" ? null : Number(rpe);

    const parsed = updateSetInputSchema.safeParse({
      setId,
      reps: parsedReps,
      weight: parsedWeight,
      rpe: parsedRpe,
      notes: notes.trim() || null,
      expectedVersion: version,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid set values.";
      setSetFormError(message);
      toast.error(message);
      return;
    }

    updateSetMutation.mutate(parsed.data);
  };

  const canCompleteWorkout = Boolean(workout && workout.sets.length > 0);

  const activeUnit = preferences.weightUnit;
  let weightPlaceholder = `Weight (${activeUnit})`;
  if (isSelectedMovementBodyweight) {
    weightPlaceholder = latestBodyWeight
      ? `Weight (${activeUnit}) auto-filled from latest bodyweight`
      : "Record bodyweight first in Settings";
  }

  const activeQueueMovementIds = (workout?.queue ?? [])
    .filter((queueItem: { isSkipped: boolean }) => !queueItem.isSkipped)
    .map((queueItem: { movementId: string }) => queueItem.movementId);

  const movementById = new Map(movements.map((movement) => [movement.id, movement]));
  const queuedMovementOptions = activeQueueMovementIds
    .map((movementId: string) => movementById.get(movementId))
    .filter((movement): movement is (typeof movements)[number] => Boolean(movement && !movement.archivedAt));

  const movementOptions =
    queuedMovementOptions.length > 0
      ? queuedMovementOptions
      : movements.filter((movement: { archivedAt: Date | null }) => !movement.archivedAt);

  const handleMovementChange = (movementId: string) => {
    applyMovementSelection(movementId);
  };

  const openEditor = (set: {
    id: string;
    reps: number;
    weight: number;
    rpe: number | null;
    notes: string | null;
  }) => {
    setEditingSetId(set.id);
    setReps(String(set.reps));
    setWeight(String(set.weight));
    setRpe(set.rpe == null ? "" : String(set.rpe));
    setNotes(set.notes ?? "");
    setSetFormError("");
  };

  const requestDeleteSet = (setId: string) => {
    setPendingDeleteSetId(setId);
  };

  const confirmDeleteSet = () => {
    if (!pendingDeleteSetId) return;
    deleteSetMutation.mutate(pendingDeleteSetId, {
      onSuccess: () => {
        setPendingDeleteSetId(null);
      },
      onError: () => {
        setPendingDeleteSetId(null);
      },
    });
  };

  if (!workout) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <EmptyWorkoutStateCard
          isStarting={createWorkoutMutation.isPending}
          completionSummary={completionSummary}
          onStartWorkout={() => createWorkoutMutation.mutate()}
        />
      </div>
    );
  }

  const queueMutationIsPending =
    moveQueueItemMutation.isPending ||
    setQueueItemSkippedMutation.isPending ||
    activateQueueMovementMutation.isPending ||
    setQueueTargetSetsMutation.isPending;

  const setCountsByMovementId = new Map<string, number>();
  for (const set of workout.sets) {
    setCountsByMovementId.set(set.movementId, (setCountsByMovementId.get(set.movementId) ?? 0) + 1);
  }

  const requiredQueueItems = workout.queue.filter((queueItem: { isSkipped: boolean }) => !queueItem.isSkipped);
  const isQueueComplete =
    requiredQueueItems.length > 0 &&
    requiredQueueItems.every((queueItem: { movementId: string; targetSets: number }) => {
      const completedSets = setCountsByMovementId.get(queueItem.movementId) ?? 0;
      return completedSets >= queueItem.targetSets;
    });
  let completeWorkoutLabel = "Complete Workout";
  if (completeWorkoutMutation.isPending) {
    completeWorkoutLabel = "Completing...";
  } else if (isQueueComplete) {
    completeWorkoutLabel = "Complete Workout (Ready)";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <Button
          variant={isQueueComplete ? "default" : "outline"}
          onClick={() => completeWorkoutMutation.mutate()}
          disabled={completeWorkoutMutation.isPending || !canCompleteWorkout}>
          <Check className="w-4 h-4 mr-2" />
          {completeWorkoutLabel}
        </Button>
      </div>

      {isQueueComplete ? (
        <QueueCompleteBannerCard
          isCompleting={completeWorkoutMutation.isPending}
          onFinishWorkout={() => completeWorkoutMutation.mutate()}
        />
      ) : null}

      {setFormError && (
        <Card>
          <CardContent className="py-3 text-sm text-red-700">{setFormError}</CardContent>
        </Card>
      )}

      <RestTimerCard
        lastSetLoggedAt={workout.lastSetLoggedAt}
        restTargetSeconds={workout.restTargetSeconds}
      />

      <QueueModeCard
        queue={workout.queue}
        activeMovementId={workout.activeMovementId}
        setCountsByMovementId={setCountsByMovementId}
        queueMutationIsPending={queueMutationIsPending}
        onDecreaseTargetSets={(movementId, targetSets) =>
          setQueueTargetSetsMutation.mutate({
            movementId,
            targetSets: Math.max(1, targetSets - 1),
          })
        }
        onIncreaseTargetSets={(movementId, targetSets) =>
          setQueueTargetSetsMutation.mutate({
            movementId,
            targetSets: Math.min(12, targetSets + 1),
          })
        }
        onMoveUp={(movementId) => moveQueueItemMutation.mutate({ movementId, direction: "up" })}
        onMoveDown={(movementId) => moveQueueItemMutation.mutate({ movementId, direction: "down" })}
        onActivate={(movementId) => activateQueueMovementMutation.mutate(movementId)}
        onToggleSkip={(movementId, isSkipped) =>
          setQueueItemSkippedMutation.mutate({
            movementId,
            skipped: !isSkipped,
          })
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {formatDate(new Date(), {
              timeZone: preferences.timeZone,
              formatOptions: {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddSetForm
            selectedMovement={addSetValues.selectedMovement}
            movementOptions={movementOptions}
            weight={addSetValues.weight}
            reps={addSetValues.reps}
            rpe={addSetValues.rpe}
            notes={addSetValues.notes}
            weightPlaceholder={weightPlaceholder}
            isSelectedMovementBodyweight={isSelectedMovementBodyweight}
            isPending={addSetMutation.isPending}
            canSubmit={Boolean(addSetValues.selectedMovement && addSetValues.reps)}
            onMovementChange={handleMovementChange}
            onWeightChange={(value) => addSetForm.setFieldValue("weight", value)}
            onRepsChange={(value) => addSetForm.setFieldValue("reps", value)}
            onRpeChange={(value) => addSetForm.setFieldValue("rpe", value)}
            onNotesChange={(value) => addSetForm.setFieldValue("notes", value)}
            onSubmit={() => addSetForm.handleSubmit()}
          />

          {!canCompleteWorkout && (
            <p className="text-xs text-amber-700">Add at least one set before completing this workout.</p>
          )}

          <WorkoutSetsList
            sets={workout.sets}
            editingSetId={editingSetId}
            reps={reps}
            weight={weight}
            rpe={rpe}
            notes={notes}
            isUpdatePending={updateSetMutation.isPending}
            onOpenEditor={openEditor}
            onRequestDelete={requestDeleteSet}
            onRepsChange={setReps}
            onWeightChange={setWeight}
            onRpeChange={setRpe}
            onNotesChange={setNotes}
            onInlineSave={handleInlineSave}
          />
        </CardContent>
      </Card>

      {completionSummary ? <LatestCompletionSummaryCard summary={completionSummary} /> : null}

      <ConfirmDialog
        open={pendingDeleteSetId != null}
        title="Delete set?"
        description="This permanently removes the set from the active workout."
        confirmLabel="Delete Set"
        cancelLabel="Cancel"
        cancelIcon={X}
        isPending={deleteSetMutation.isPending}
        onConfirm={confirmDeleteSet}
        onCancel={() => {
          if (!deleteSetMutation.isPending) {
            setPendingDeleteSetId(null);
          }
        }}
      />
    </div>
  );
}
