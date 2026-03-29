import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { deleteWorkoutsServerFn } from "@/lib/features/workouts/workouts.server";
import { Trash2, X } from "lucide-react";
import {
  bodyWeightHistoryQueryOptions,
  progressionSeriesQueryOptions,
  userPreferencesQueryOptions,
  workoutHistoryQueryOptions,
} from "./-queries/workout-history";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/shared/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { toast } from "sonner";
import {
  BodyweightTrendCard,
  CompletedWorkoutsTableCard,
  ProgressionInsightsCard,
} from "@/components/features/workout-history";

type MovementTuple = [string, string];

type WorkoutSet = {
  movement: { id: string; name: string };
  reps: number;
  weight: number;
  weightUnit: "kg" | "lbs";
  weightSnapshotKg: number;
};

type WorkoutRow = {
  id: string;
  completedAt: string | Date | null;
  sets: WorkoutSet[];
  summary: {
    durationSeconds: number;
    totalVolumeKg: number;
    totalSets: number;
    uniqueExercises: number;
  };
};

type SeriesPoint = {
  date: string;
  value: number;
};

type BodyWeightPoint = {
  date: string | Date;
  weight: number;
  weightUnit: "kg" | "lbs";
};

type WorkoutMovementSummary = {
  movementId: string;
  movementName: string;
  sets: number;
  avgReps: number;
  maxWeight: number;
  weightUnit: "kg" | "lbs";
  totalVolumeKg: number;
};

type WorkoutTableRow = {
  id: string;
  completedAt: string | Date | null;
  summary: WorkoutRow["summary"];
  movementSummaries: WorkoutMovementSummary[];
};

function buildMovementSummaries(sets: WorkoutSet[]): WorkoutMovementSummary[] {
  const setsByMovement = new Map<string, WorkoutSet[]>();

  sets.forEach((set) => {
    const existing = setsByMovement.get(set.movement.id) || [];
    setsByMovement.set(set.movement.id, [...existing, set]);
  });

  return Array.from(setsByMovement.entries())
    .map(([movementId, movementSets]) => {
      const totalReps = movementSets.reduce((sum, set) => sum + set.reps, 0);
      const avgReps = Math.round(totalReps / movementSets.length);
      const maxWeight = Math.max(...movementSets.map((set) => set.weight));
      const totalVolumeKg =
        Math.round(movementSets.reduce((sum, set) => sum + set.weightSnapshotKg * set.reps, 0) * 100) / 100;

      return {
        movementId,
        movementName: movementSets[0]?.movement.name ?? "Unknown",
        sets: movementSets.length,
        avgReps,
        maxWeight,
        weightUnit: movementSets[0]?.weightUnit ?? "kg",
        totalVolumeKg,
      };
    })
    .sort((a, b) => a.movementName.localeCompare(b.movementName));
}

export const Route = createFileRoute("/__index/_layout/workout-history/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(workoutHistoryQueryOptions()),
      context.queryClient.ensureQueryData(bodyWeightHistoryQueryOptions()),
      context.queryClient.ensureQueryData(userPreferencesQueryOptions()),
    ]);
  },
  component: WorkoutHistoryPage,
});

function WorkoutHistoryPage() {
  const queryClient = useQueryClient();
  const { data: workouts } = useSuspenseQuery(workoutHistoryQueryOptions());
  const { data: bodyWeightSeries } = useSuspenseQuery(bodyWeightHistoryQueryOptions());
  const { data: preferences } = useSuspenseQuery(userPreferencesQueryOptions());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<"maxWeight" | "totalReps" | "totalVolume">("maxWeight");
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const { data: progressionSeries = [] } = useQuery(
    progressionSeriesQueryOptions(selectedMovementId, selectedMetric),
  );
  const timeZone = preferences.timeZone;
  const hasMovementSelected = selectedMovementId.length > 0;
  const progressionItems = progressionSeries as SeriesPoint[];
  const hasProgressionPoints = progressionItems.length > 0;
  const latestProgressionPoint = hasProgressionPoints ? (progressionItems.at(-1) ?? null) : null;
  const previousProgressionPoint = progressionItems.length > 1 ? (progressionItems.at(-2) ?? null) : null;
  const bestProgressionPoint = hasProgressionPoints
    ? progressionItems.reduce((best, point) => (point.value > best.value ? point : best), progressionItems[0])
    : null;
  const progressionDelta = latestProgressionPoint && previousProgressionPoint
    ? latestProgressionPoint.value - previousProgressionPoint.value
    : null;
  const progressionDeltaSign = progressionDelta !== null && progressionDelta > 0 ? "+" : "";
  const progressionDeltaLabel = progressionDelta === null ? "-" : `${progressionDeltaSign}${formatNumber(progressionDelta)}`;

  const workoutsWithMovementSummaries = useMemo<WorkoutTableRow[]>(
    () =>
      (workouts as WorkoutRow[]).map((workout) => ({
        id: workout.id,
        completedAt: workout.completedAt,
        summary: workout.summary,
        movementSummaries: buildMovementSummaries(workout.sets),
      })),
    [workouts],
  );

  const deleteWorkoutsMutation = useMutation({
    mutationFn: (workoutIds: string[]) =>
      deleteWorkoutsServerFn({ data: { workoutIds }, headers: getCsrfHeaders() }),
    onSuccess: (response, workoutIds) => {
      if (!response.success) {
        toast.error("Unable to delete workouts.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: workoutHistoryQueryOptions().queryKey });
      setSelectedWorkouts(new Set());
      toast.success(`${workoutIds.length} workout${workoutIds.length === 1 ? "" : "s"} deleted.`);
    },
  });

  // Get all unique movements across all workouts
  const uniqueMovements: MovementTuple[] = Array.from(
    new Map(
      (workouts as WorkoutRow[]).flatMap((w) =>
        w.sets.map((s): MovementTuple => [s.movement.id, s.movement.name]),
      ),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const toggleWorkout = (id: string) => {
    setSelectedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleWorkoutDetails = (id: string) => {
    setExpandedWorkoutId((prev) => (prev === id ? null : id));
  };

  const toggleAll = () => {
    if (selectedWorkouts.size === workouts.length) {
      setSelectedWorkouts(new Set());
    } else {
      setSelectedWorkouts(new Set((workouts as WorkoutRow[]).map((w) => w.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedWorkouts.size === 0) return;
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteSelected = () => {
    const workoutIds = Array.from(selectedWorkouts);
    if (workoutIds.length === 0) {
      setIsDeleteConfirmOpen(false);
      return;
    }

    deleteWorkoutsMutation.mutate(workoutIds, {
      onSuccess: () => {
        setIsDeleteConfirmOpen(false);
      },
      onError: () => {
        setIsDeleteConfirmOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Workout History</h1>
      </div>

      <ProgressionInsightsCard
        uniqueMovements={uniqueMovements}
        selectedMovementId={selectedMovementId}
        selectedMetric={selectedMetric}
        onMovementChange={setSelectedMovementId}
        onMetricChange={setSelectedMetric}
        hasMovementSelected={hasMovementSelected}
        hasProgressionPoints={hasProgressionPoints}
        progressionItems={progressionItems}
        latestProgressionPoint={latestProgressionPoint}
        bestProgressionPoint={bestProgressionPoint}
        progressionDeltaLabel={progressionDeltaLabel}
      />

      <BodyweightTrendCard bodyWeightSeries={bodyWeightSeries as BodyWeightPoint[]} timeZone={timeZone} />

      <CompletedWorkoutsTableCard
        workouts={workoutsWithMovementSummaries}
        selectedWorkouts={selectedWorkouts}
        expandedWorkoutId={expandedWorkoutId}
        timeZone={timeZone}
        isDeletePending={deleteWorkoutsMutation.isPending}
        onToggleAll={toggleAll}
        onToggleWorkout={toggleWorkout}
        onToggleWorkoutDetails={toggleWorkoutDetails}
        onDeleteSelected={handleDeleteSelected}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete selected workouts?"
        description={`This permanently deletes ${selectedWorkouts.size} completed workout${selectedWorkouts.size === 1 ? "" : "s"} and all logged sets in them.`}
        confirmLabel="Delete Workouts"
        cancelLabel="Cancel"
        confirmIcon={Trash2}
        cancelIcon={X}
        isPending={deleteWorkoutsMutation.isPending}
        onConfirm={confirmDeleteSelected}
        onCancel={() => {
          if (!deleteWorkoutsMutation.isPending) {
            setIsDeleteConfirmOpen(false);
          }
        }}
      />
    </div>
  );
}
