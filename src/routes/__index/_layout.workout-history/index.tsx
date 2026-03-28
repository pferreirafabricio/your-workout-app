import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/action-buttons";
import { deleteWorkoutsServerFn } from "@/lib/features/workouts/workouts.server";
import { ChevronDown, ChevronUp, Dumbbell, Eye, EyeOff, Scale, Timer, Trash2, TrendingUp, X } from "lucide-react";
import {
  bodyWeightHistoryQueryOptions,
  progressionSeriesQueryOptions,
  userPreferencesQueryOptions,
  workoutHistoryQueryOptions,
} from "./-queries/workout-history";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import {
  formatDate,
  formatDateKey,
  formatDateTime,
  formatDurationSeconds,
  formatNumber,
  formatWeight,
} from "@/lib/shared/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCsrfHeaders } from "@/lib/csrf.client";
import { toast } from "sonner";

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

      <Card>
        <CardHeader>
          <CardTitle>Progression Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="progression-movement">
                Movement
              </label>
              <Select
                id="progression-movement"
                value={selectedMovementId}
                onChange={(event) => setSelectedMovementId(event.target.value)}>
                <option value="">Select movement</option>
                {uniqueMovements.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="progression-metric">
                Metric
              </label>
              <Select
                id="progression-metric"
                value={selectedMetric}
                onChange={(event) =>
                  setSelectedMetric(event.target.value as "maxWeight" | "totalReps" | "totalVolume")
                }>
                <option value="maxWeight">Max Weight</option>
                <option value="totalReps">Total Reps</option>
                <option value="totalVolume">Total Volume</option>
              </Select>
            </div>
          </div>

          {!hasMovementSelected && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Select a movement to reveal progression cards and trend points.
            </div>
          )}
          {hasMovementSelected && !hasProgressionPoints && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              No progression points for this movement and metric yet.
            </div>
          )}
          {hasMovementSelected && hasProgressionPoints && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium uppercase tracking-wide">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Latest
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-emerald-900">{formatNumber(latestProgressionPoint?.value ?? 0)}</p>
                  <p className="mt-1 text-xs text-emerald-700">{formatDateKey(latestProgressionPoint?.date ?? "")}</p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-medium uppercase tracking-wide">
                    <Scale className="h-3.5 w-3.5" />
                    Best
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-blue-900">{formatNumber(bestProgressionPoint?.value ?? 0)}</p>
                  <p className="mt-1 text-xs text-blue-700">{formatDateKey(bestProgressionPoint?.date ?? "")}</p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-medium uppercase tracking-wide">
                    <Dumbbell className="h-3.5 w-3.5" />
                    Delta vs previous
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-amber-900">
                    {progressionDeltaLabel}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">{progressionItems.length} points logged</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {progressionItems.map((point, index) => {
                  const isLatest = index === progressionItems.length - 1;
                  return (
                    <div
                      key={`${point.date}-${point.value}`}
                      className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                        isLatest ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                      }`}>
                      <span className="text-slate-600">{formatDateKey(point.date)}</span>
                      <span className="font-semibold text-slate-900">{formatNumber(point.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bodyweight Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {bodyWeightSeries.length === 0 ? (
            <p className="text-sm text-slate-500">No bodyweight entries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {(bodyWeightSeries as BodyWeightPoint[]).map((point) => (
                <li key={`${point.date}-${point.weight}`} className="bg-slate-50 rounded-lg px-3 py-2 flex justify-between">
                  <span>{formatDateTime(point.date, { timeZone })}</span>
                  <span className="font-medium">{formatWeight(point.weight, point.weightUnit)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Completed Workouts</CardTitle>
          <DeleteButton
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedWorkouts.size === 0}
            isLoading={deleteWorkoutsMutation.isPending}
            loadingText="Deleting...">
            {`Delete Selected (${selectedWorkouts.size})`}
          </DeleteButton>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="text-sm text-slate-500">No completed workouts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedWorkouts.size === workouts.length}
                        onChange={toggleAll}
                        className="block rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Total Time</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Total Weight</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Series</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Exercises</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(workouts as WorkoutRow[]).map((workout) => {
                    const setsByMovement = new Map<string, typeof workout.sets>();
                    workout.sets.forEach((set: WorkoutSet) => {
                      const existing = setsByMovement.get(set.movement.id) || [];
                      setsByMovement.set(set.movement.id, [...existing, set]);
                    });
                    const movementSummaries = Array.from(setsByMovement.entries())
                      .map(([movementId, movementSets]) => {
                        const totalReps = movementSets.reduce((sum, set) => sum + set.reps, 0);
                        const avgReps = Math.round(totalReps / movementSets.length);
                        const maxWeight = Math.max(...movementSets.map((set) => set.weight));
                        const totalVolumeKg =
                          Math.round(
                            movementSets.reduce((sum, set) => sum + set.weightSnapshotKg * set.reps, 0) * 100,
                          ) / 100;

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

                    const isSelected = selectedWorkouts.has(workout.id);
                    const isExpanded = expandedWorkoutId === workout.id;
                    return (
                      <Fragment key={workout.id}>
                        <tr
                          className={`border-b border-slate-100 ${isSelected ? "bg-primary/10" : "hover:bg-slate-50"}`}>
                          <td className="py-3 px-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedWorkouts.has(workout.id)}
                              onChange={() => toggleWorkout(workout.id)}
                              className="block rounded border-gray-300"
                            />
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {workout.completedAt ? formatDate(workout.completedAt, { timeZone }) : "-"}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Timer className="h-3.5 w-3.5 text-slate-400" />
                              {formatDurationSeconds(workout.summary.durationSeconds)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 font-medium">
                            {formatWeight(workout.summary.totalVolumeKg, "kg")}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">{workout.summary.totalSets}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{workout.summary.uniqueExercises}</td>
                          <td className="py-3 px-4 text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => toggleWorkoutDetails(workout.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                  aria-expanded={isExpanded}
                                  aria-controls={`workout-details-${workout.id}`}>
                                  {isExpanded ? (
                                    <>
                                      <EyeOff className="h-3.5 w-3.5" />
                                      Hide
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3.5 w-3.5" />
                                      Show
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>
                                {isExpanded
                                  ? "Hide movement-by-movement details for this workout row."
                                  : "Show movement breakdown with sets, average reps, max weight, and volume for this workout."}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr id={`workout-details-${workout.id}`} className="border-b border-slate-100 bg-slate-50/70">
                            <td colSpan={8} className="px-4 py-4">
                              {movementSummaries.length === 0 ? (
                                <p className="text-sm text-slate-500">No movement data for this workout.</p>
                              ) : (
                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                  <table className="w-full text-xs md:text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                      <tr>
                                        <th className="text-left px-3 py-2 font-medium text-slate-600">Movement</th>
                                        <th className="text-right px-3 py-2 font-medium text-slate-600">Sets</th>
                                        <th className="text-right px-3 py-2 font-medium text-slate-600">Avg reps</th>
                                        <th className="text-right px-3 py-2 font-medium text-slate-600">Max weight</th>
                                        <th className="text-right px-3 py-2 font-medium text-slate-600">Volume</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {movementSummaries.map((movement) => (
                                        <tr key={movement.movementId} className="border-b border-slate-100 last:border-b-0">
                                          <td className="px-3 py-2 text-slate-700">{movement.movementName}</td>
                                          <td className="px-3 py-2 text-right text-slate-600">{movement.sets}</td>
                                          <td className="px-3 py-2 text-right text-slate-600">{movement.avgReps}</td>
                                          <td className="px-3 py-2 text-right text-slate-600">
                                            {formatWeight(movement.maxWeight, movement.weightUnit)}
                                          </td>
                                          <td className="px-3 py-2 text-right text-slate-600 font-medium">
                                            {formatWeight(movement.totalVolumeKg, "kg")}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
