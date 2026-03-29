import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { AddButton, DeleteButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { Play, Check, X, ArrowUp, ArrowDown, CircleDot, Minus, Plus, Loader2 } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bodyWeightSeriesQueryOptions,
  currentWorkoutQueryOptions,
  movementsQueryOptions,
  userPreferencesQueryOptions,
} from "./-queries/current-workout";
import { addSetInputSchema, updateSetInputSchema } from "@/lib/features/workouts/workouts.validation";
import { formatDate, formatDurationSeconds, formatWeight } from "@/lib/shared/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { toast } from "sonner";

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
  const [nowMs, setNowMs] = useState(() => Date.now());

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
    (movement: { id: string; type: string }) => movement.id === addSetForm.state.values.selectedMovement,
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
    if (!workout?.lastSetLoggedAt) {
      return;
    }

    const intervalId = globalThis.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [workout?.lastSetLoggedAt]);

  useEffect(() => {
    if (!workout) {
      return;
    }

    if (!addSetForm.state.values.selectedMovement && workout.activeMovementId) {
      applyMovementSelection(workout.activeMovementId);
    }
  }, [addSetForm.state.values.selectedMovement, workout]);

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
  const restTargetSeconds = workout?.restTargetSeconds ?? 0;
  const restElapsedSeconds =
    workout?.lastSetLoggedAt
      ? Math.max(0, Math.floor((nowMs - new Date(workout.lastSetLoggedAt).getTime()) / 1000))
      : 0;
  const restTargetReached = Boolean(workout?.lastSetLoggedAt && restElapsedSeconds >= restTargetSeconds);
  const restRemainingSeconds = Math.max(0, restTargetSeconds - restElapsedSeconds);
  const restProgress = workout?.lastSetLoggedAt
    ? Math.min(1, restElapsedSeconds / Math.max(1, restTargetSeconds))
    : 0;

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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">No active workout. Ready to start?</p>
            <Button onClick={() => createWorkoutMutation.mutate()} size="lg">
              <Play className="w-4 h-4 mr-2" />
              {createWorkoutMutation.isPending ? "Starting..." : "Start Workout"}
            </Button>
            {completionSummary && (
              <p className="text-sm text-emerald-700 mt-4">
                Last workout: {formatDurationSeconds(completionSummary.durationSeconds)}, {" "}
                {formatWeight(completionSummary.totalVolumeKg, "kg")} total volume.
              </p>
            )}
          </CardContent>
        </Card>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <Button
          variant={isQueueComplete ? "default" : "outline"}
          onClick={() => completeWorkoutMutation.mutate()}
          disabled={completeWorkoutMutation.isPending || !canCompleteWorkout}>
          <Check className="w-4 h-4 mr-2" />
          {completeWorkoutMutation.isPending ? "Completing..." : isQueueComplete ? "Complete Workout (Ready)" : "Complete Workout"}
        </Button>
      </div>

      {isQueueComplete && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-700 font-medium">
              You hit all queue targets. You can complete this workout now.
            </p>
            <Button
              size="sm"
              onClick={() => completeWorkoutMutation.mutate()}
              disabled={completeWorkoutMutation.isPending}>
              <Check className="h-4 w-4 mr-2" />
              Finish Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {setFormError && (
        <Card>
          <CardContent className="py-3 text-sm text-red-700">{setFormError}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-5 px-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="h-24 w-24 rounded-full grid place-items-center text-slate-900 text-sm font-semibold"
              style={{
                background: `conic-gradient(${restTargetReached ? "#059669" : "#0f766e"} ${Math.round(restProgress * 360)}deg, #e2e8f0 0deg)`,
              }}>
              <div className="h-[4.8rem] w-[4.8rem] rounded-full bg-white grid place-items-center leading-tight text-center">
                <div>{workout.lastSetLoggedAt ? `${restRemainingSeconds}s` : "Ready"}</div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Rest timer</p>
              <p className="text-base font-semibold text-slate-900">
                {workout.lastSetLoggedAt ? `${restElapsedSeconds}s elapsed` : "Starts after your first set"}
              </p>
              <p className="text-sm text-slate-600">Target: {workout.restTargetSeconds}s</p>
            </div>
          </div>
          <span className={restTargetReached ? "text-emerald-600 font-semibold" : "text-slate-500 font-medium"}>
            {workout.lastSetLoggedAt ? (restTargetReached ? "Target reached" : "Keep resting") : "No active rest interval"}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="h-4 w-4" />
            Queue Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workout.queue.length === 0 ? (
            <p className="text-sm text-slate-500">No queued movements yet. Create a movement to begin.</p>
          ) : (
            <ul className="space-y-2">
              {workout.queue.map((queueItem: {
                id: string;
                movementId: string;
                targetSets: number;
                isSkipped: boolean;
                movement: { name: string };
              }, index: number) => {
                const isActive = workout.activeMovementId === queueItem.movementId;
                const completedSets = setCountsByMovementId.get(queueItem.movementId) ?? 0;
                const isCompleted = completedSets >= queueItem.targetSets && !queueItem.isSkipped;
                return (
                  <li
                    key={queueItem.id}
                    className={`rounded-lg border px-3 py-2 flex items-center justify-between ${isActive ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"}`}>
                    <div>
                      <p className={`font-medium ${queueItem.isSkipped ? "text-slate-400 line-through" : "text-slate-900"}`}>
                        {index + 1}. {queueItem.movement.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {completedSets}/{queueItem.targetSets} sets
                      </p>
                      {isActive && <p className="text-xs text-teal-700">Active movement</p>}
                      {isCompleted && (
                        <p className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Completed
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setQueueTargetSetsMutation.mutate({
                            movementId: queueItem.movementId,
                            targetSets: Math.max(1, queueItem.targetSets - 1),
                          })
                        }
                        disabled={queueMutationIsPending || queueItem.targetSets <= 1}
                        aria-label="Decrease target sets">
                        {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setQueueTargetSetsMutation.mutate({
                            movementId: queueItem.movementId,
                            targetSets: Math.min(12, queueItem.targetSets + 1),
                          })
                        }
                        disabled={queueMutationIsPending || queueItem.targetSets >= 12}
                        aria-label="Increase target sets">
                        {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveQueueItemMutation.mutate({ movementId: queueItem.movementId, direction: "up" })}
                        disabled={queueMutationIsPending || index === 0}
                        aria-label="Move up">
                        {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveQueueItemMutation.mutate({ movementId: queueItem.movementId, direction: "down" })}
                        disabled={queueMutationIsPending || index === workout.queue.length - 1}
                        aria-label="Move down">
                        {queueMutationIsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant={isActive ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => activateQueueMovementMutation.mutate(queueItem.movementId)}
                        disabled={queueMutationIsPending || isActive}>
                        {queueMutationIsPending ? "loading..." : isActive ? "Active" : "Set Active"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setQueueItemSkippedMutation.mutate({
                            movementId: queueItem.movementId,
                            skipped: !queueItem.isSkipped,
                          })
                        }
                        disabled={queueMutationIsPending}>
                        {queueMutationIsPending ? "loading..." : queueItem.isSkipped ? "Unskip" : "Skip"}
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addSetForm.handleSubmit();
            }}
            className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
            <addSetForm.Field name="selectedMovement">
              {(field) => (
                <Select value={field.state.value} onChange={(e) => handleMovementChange(e.target.value)}>
                  <option value="">Select movement</option>
                  {movementOptions.map((m: { id: string; name: string }) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}
            </addSetForm.Field>
            <addSetForm.Field name="weight">
              {(field) => (
                <Input
                  type="number"
                  placeholder={weightPlaceholder}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full"
                  min={0}
                  disabled={isSelectedMovementBodyweight}
                />
              )}
            </addSetForm.Field>
            <addSetForm.Field name="reps">
              {(field) => (
                <Input
                  type="number"
                  placeholder="Reps"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full"
                  min={1}
                />
              )}
            </addSetForm.Field>
            <addSetForm.Field name="rpe">
              {(field) => (
                <Input
                  type="number"
                  placeholder="RPE (optional)"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full"
                  min={1}
                  max={10}
                  step={0.5}
                />
              )}
            </addSetForm.Field>
            <addSetForm.Field name="notes">
              {(field) => (
                <Input
                  placeholder="Notes (optional)"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full"
                  maxLength={500}
                />
              )}
            </addSetForm.Field>
            <AddButton
              type="submit"
              size="sm"
              disabled={!addSetForm.state.values.selectedMovement || !addSetForm.state.values.reps}
              isLoading={addSetMutation.isPending}
            />
          </form>

          {!canCompleteWorkout && (
            <p className="text-xs text-amber-700">Add at least one set before completing this workout.</p>
          )}

          {workout.sets.length === 0 ? (
            <p className="text-sm text-slate-500">No sets yet. Add exercises to your workout!</p>
          ) : (
            <ul className="space-y-2">
              {workout.sets.map((set: {
                id: string;
                reps: number;
                weight: number;
                weightUnit: "kg" | "lbs";
                rpe: number | null;
                notes: string | null;
                version: number;
                movement: { name: string };
              }) => (
                <li key={set.id} className="px-3 py-2 bg-slate-50 rounded-lg text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium">{set.movement.name}</span>
                    <span className="text-slate-500 ml-2">
                      {set.reps} reps x {formatWeight(set.weight, set.weightUnit)}
                    </span>
                    {set.rpe != null && <span className="text-slate-500 ml-2">RPE {set.rpe}</span>}
                    {set.notes && <p className="text-xs text-slate-500 mt-1">{set.notes}</p>}
                    {editingSetId === set.id && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          type="number"
                          value={reps}
                          min={1}
                          onChange={(event) => setReps(event.target.value)}
                        />
                        <Input
                          type="number"
                          value={weight}
                          min={0}
                          onChange={(event) => setWeight(event.target.value)}
                        />
                        <Input type="number" value={rpe} min={1} max={10} step={0.5} onChange={(event) => setRpe(event.target.value)} />
                        <Input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
                        <SaveButton
                          size="sm"
                          onClick={() => handleInlineSave(set.id, set.version)}
                          disabled={updateSetMutation.isPending}
                          isLoading={updateSetMutation.isPending}
                          loadingText="loading...">
                          Save
                        </SaveButton>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <EditButton
                      onClick={() => openEditor(set)}
                      className="h-8 w-8 text-slate-400"
                      iconOnly
                    />
                    <DeleteButton
                      variant="ghost"
                      size="icon"
                      iconOnly
                      onClick={() => requestDeleteSet(set.id)}
                      className="h-8 w-8 text-slate-400"
                      aria-label="Delete set">
                      Delete set
                    </DeleteButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {completionSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Completion Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            Duration: {formatDurationSeconds(completionSummary.durationSeconds)}. Total volume: {" "}
            {formatWeight(completionSummary.totalVolumeKg, "kg")}
          </CardContent>
        </Card>
      )}

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
