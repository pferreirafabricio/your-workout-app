import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AddButton, DeleteButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createWorkoutServerFn,
  completeWorkoutServerFn,
  addSetServerFn,
  updateSetServerFn,
  deleteSetServerFn,
} from "@/lib/features/workouts/workouts.server";
import { Play, Check, X } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bodyWeightSeriesQueryOptions,
  currentWorkoutQueryOptions,
  movementsQueryOptions,
  userPreferencesQueryOptions,
} from "./-queries/current-workout";
import { addSetInputSchema, updateSetInputSchema } from "@/lib/features/workouts/workout-progression";
import { formatDate, formatDurationSeconds, formatWeight } from "@/lib/shared/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/csrf.client";
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
  const [selectedMovement, setSelectedMovement] = useState("");
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

  const selectedMovementRecord = movements.find((movement: { id: string; type: string }) => movement.id === selectedMovement);
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
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      setReps("");
      setWeight("");
      setRpe("");
      setNotes("");
      setSetFormError("");
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

  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedReps = Number(reps);
    const parsedWeight = weight.trim() === "" ? undefined : Number(weight);
    const parsedRpe = rpe.trim() === "" ? undefined : Number(rpe);

    if (isSelectedMovementBodyweight && !bodyWeightSeries.length && parsedWeight === undefined) {
      const message = "Record bodyweight first before adding a bodyweight set.";
      setSetFormError(message);
      toast.error(message);
      return;
    }

    const parsed = addSetInputSchema.safeParse({
      movementId: selectedMovement,
      reps: parsedReps,
      weight: parsedWeight,
      rpe: parsedRpe,
      notes: notes.trim() || undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid set values.";
      setSetFormError(message);
      toast.error(message);
      return;
    }

    addSetMutation.mutate(parsed.data);
  };

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
  const restElapsedSeconds =
    workout?.lastSetLoggedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(workout.lastSetLoggedAt).getTime()) / 1000))
      : 0;
  const restTargetReached = Boolean(workout?.lastSetLoggedAt && restElapsedSeconds >= workout.restTargetSeconds);

  const activeUnit = preferences.weightUnit;
  let weightPlaceholder = `Weight (${activeUnit})`;
  if (isSelectedMovementBodyweight) {
    weightPlaceholder = latestBodyWeight
      ? `Weight (${activeUnit}) auto-filled from latest bodyweight`
      : "Record bodyweight first in Settings";
  }

  const movementOptions = movements.filter((movement: { archivedAt: Date | null }) => !movement.archivedAt);

  const handleMovementChange = (movementId: string) => {
    setSelectedMovement(movementId);
    setSetFormError("");

    const movement = movements.find((item: { id: string; type: string }) => item.id === movementId);
    if (movement?.type === "BODYWEIGHT") {
      if (latestBodyWeight) {
        setWeight(String(latestBodyWeight.weight));
      } else {
        setWeight("");
      }
      return;
    }

    setWeight("");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <Button
          variant="outline"
          onClick={() => completeWorkoutMutation.mutate()}
          disabled={completeWorkoutMutation.isPending || !canCompleteWorkout}>
          <Check className="w-4 h-4 mr-2" />
          {completeWorkoutMutation.isPending ? "Completing..." : "Complete Workout"}
        </Button>
      </div>

      {setFormError && (
        <Card>
          <CardContent className="py-3 text-sm text-red-700">{setFormError}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-3 text-sm text-slate-700 flex items-center justify-between">
          <span>
            Rest timer: {restElapsedSeconds}s / target {workout.restTargetSeconds}s
          </span>
          <span className={restTargetReached ? "text-emerald-600 font-semibold" : "text-slate-500"}>
            {restTargetReached ? "Target reached" : "Keep resting"}
          </span>
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
          <form onSubmit={handleAddSet} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
            <Select value={selectedMovement} onChange={(e) => handleMovementChange(e.target.value)}>
              <option value="">Select movement</option>
              {movementOptions.map((m: { id: string; name: string }) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder={weightPlaceholder}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full"
              min={0}
              disabled={isSelectedMovementBodyweight}
            />
            <Input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full"
              min={1}
            />
            <Input
              type="number"
              placeholder="RPE (optional)"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="w-full"
              min={1}
              max={10}
              step={0.5}
            />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
              maxLength={500}
            />
            <AddButton
              type="submit"
              size="sm"
              disabled={!selectedMovement || !reps}
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
                          disabled={updateSetMutation.isPending}>
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
