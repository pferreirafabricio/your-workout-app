import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/action-buttons";
import { deleteWorkoutsServerFn } from "@/lib/workouts.server";
import { Trash2, X } from "lucide-react";
import {
  bodyWeightHistoryQueryOptions,
  progressionSeriesQueryOptions,
  workoutHistoryQueryOptions,
} from "./-queries/workout-history";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { formatDateTime, formatNumber, formatWeight } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/csrf.client";
import { toast } from "sonner";

type MovementTuple = [string, string];

type WorkoutSet = {
  movement: { id: string; name: string };
  reps: number;
  weight: number;
  weightUnit: "kg" | "lbs";
};

type WorkoutRow = {
  id: string;
  completedAt: string | Date | null;
  sets: WorkoutSet[];
};

type SeriesPoint = {
  date: string | Date;
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
    ]);
  },
  component: WorkoutHistoryPage,
});

function WorkoutHistoryPage() {
  const queryClient = useQueryClient();
  const { data: workouts } = useSuspenseQuery(workoutHistoryQueryOptions());
  const { data: bodyWeightSeries } = useSuspenseQuery(bodyWeightHistoryQueryOptions());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<"maxWeight" | "totalReps" | "totalVolume">("maxWeight");

  const { data: progressionSeries = [] } = useQuery(
    progressionSeriesQueryOptions(selectedMovementId, selectedMetric),
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
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Movement</label>
              <Select value={selectedMovementId} onChange={(event) => setSelectedMovementId(event.target.value)}>
                <option value="">Select movement</option>
                {uniqueMovements.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Metric</label>
              <Select
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

          {!selectedMovementId ? (
            <p className="text-sm text-slate-500">Select a movement to view progression points.</p>
          ) : progressionSeries.length === 0 ? (
            <p className="text-sm text-slate-500">No progression points for this selection.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {(progressionSeries as SeriesPoint[]).map((point) => (
                <li key={`${point.date}-${point.value}`} className="bg-slate-50 rounded-lg px-3 py-2 flex justify-between">
                  <span>{formatDateTime(point.date)}</span>
                  <span className="font-medium">{formatNumber(point.value)}</span>
                </li>
              ))}
            </ul>
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
                  <span>{formatDateTime(point.date)}</span>
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedWorkouts.size === workouts.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Sets</th>
                    {uniqueMovements.map(([id, name]) => (
                      <th key={id} className="text-right py-3 px-4 font-medium text-slate-600">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(workouts as WorkoutRow[]).map((workout) => {
                    const setsByMovement = new Map<string, typeof workout.sets>();
                    workout.sets.forEach((set: WorkoutSet) => {
                      const existing = setsByMovement.get(set.movement.id) || [];
                      setsByMovement.set(set.movement.id, [...existing, set]);
                    });

                    const isSelected = selectedWorkouts.has(workout.id);
                    return (
                      <tr
                        key={workout.id}
                        className={`border-b border-slate-100 ${isSelected ? "bg-primary/10" : "hover:bg-slate-50"}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedWorkouts.has(workout.id)}
                            onChange={() => toggleWorkout(workout.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {workout.completedAt
                            ? new Date(workout.completedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{workout.sets.length}</td>
                        {uniqueMovements.map(([movementId]) => {
                          const movementSets = setsByMovement.get(movementId);
                          if (!movementSets || movementSets.length === 0) {
                            return (
                              <td key={movementId} className="py-3 px-4 text-right text-slate-300">
                                -
                              </td>
                            );
                          }
                          const maxWeight = Math.max(...movementSets.map((s: WorkoutSet) => s.weight));
                          const avgReps = Math.round(
                            movementSets.reduce((sum: number, s: WorkoutSet) => sum + s.reps, 0) / movementSets.length,
                          );
                          const numSets = movementSets.length;
                          return (
                            <td key={movementId} className="py-3 px-4 text-right text-slate-600">
                              {maxWeight} {movementSets[0].weightUnit} / {avgReps} reps / {numSets} sets
                            </td>
                          );
                        })}
                      </tr>
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
