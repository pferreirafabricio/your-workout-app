import { Fragment } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Timer } from "lucide-react";
import { DeleteButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatDurationSeconds, formatWeight } from "@/lib/shared/utils";

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
  summary: {
    durationSeconds: number;
    totalVolumeKg: number;
    totalSets: number;
    uniqueExercises: number;
  };
  movementSummaries: WorkoutMovementSummary[];
};

type CompletedWorkoutsTableCardProps = {
  workouts: WorkoutTableRow[];
  selectedWorkouts: Set<string>;
  expandedWorkoutId: string | null;
  timeZone: string;
  isDeletePending: boolean;
  onToggleAll: () => void;
  onToggleWorkout: (id: string) => void;
  onToggleWorkoutDetails: (id: string) => void;
  onDeleteSelected: () => void;
};

export function CompletedWorkoutsTableCard({
  workouts,
  selectedWorkouts,
  expandedWorkoutId,
  timeZone,
  isDeletePending,
  onToggleAll,
  onToggleWorkout,
  onToggleWorkoutDetails,
  onDeleteSelected,
}: Readonly<CompletedWorkoutsTableCardProps>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Completed Workouts</CardTitle>
        <DeleteButton
          size="sm"
          variant="destructive"
          onClick={onDeleteSelected}
          disabled={selectedWorkouts.size === 0}
          isLoading={isDeletePending}
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
                      onChange={onToggleAll}
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
                {workouts.map((workout) => {
                  const isSelected = selectedWorkouts.has(workout.id);
                  const isExpanded = expandedWorkoutId === workout.id;

                  return (
                    <Fragment key={workout.id}>
                      <tr className={`border-b border-slate-100 ${isSelected ? "bg-primary/10" : "hover:bg-slate-50"}`}>
                        <td className="py-3 px-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedWorkouts.has(workout.id)}
                            onChange={() => onToggleWorkout(workout.id)}
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
                                onClick={() => onToggleWorkoutDetails(workout.id)}
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
                            {workout.movementSummaries.length === 0 ? (
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
                                    {workout.movementSummaries.map((movement) => (
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
  );
}
