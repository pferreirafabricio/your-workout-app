import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveButton, SubmitButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bodyWeightSeriesQueryOptions, userPreferencesQueryOptions } from "./_layout.current-workout/-queries/current-workout";
import { recordBodyWeightServerFn, setUserPreferencesServerFn } from "@/lib/features/workouts/workouts.server";
import { recordBodyWeightInputSchema, setUserPreferencesInputSchema } from "@/lib/features/workouts/workout-progression";
import { nutritionGoalsQueryOptions } from "./_layout.nutrition/-queries/nutrition";
import { upsertNutritionGoalsServerFn } from "@/lib/features/nutrition/nutrition.server";
import { formatDateTime, formatWeight } from "@/lib/shared/utils";
import { getCsrfHeaders } from "@/lib/csrf.client";
import { toast } from "sonner";

const COMMON_TIME_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
];

type NutritionGoalType = "CUT" | "MAINTENANCE" | "BULK";

export const Route = createFileRoute("/__index/_layout/settings")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(userPreferencesQueryOptions()),
      context.queryClient.ensureQueryData(bodyWeightSeriesQueryOptions()),
      context.queryClient.ensureQueryData(nutritionGoalsQueryOptions()),
    ]);
  },
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: preferences } = useSuspenseQuery(userPreferencesQueryOptions());
  const { data: bodyWeightSeries } = useSuspenseQuery(bodyWeightSeriesQueryOptions());
  const { data: nutritionGoals } = useSuspenseQuery(nutritionGoalsQueryOptions());
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [unit, setUnit] = useState<"kg" | "lbs">(preferences.weightUnit);
  const [restTarget, setRestTarget] = useState(String(preferences.defaultRestTargetSeconds ?? 120));
  const [timeZone, setTimeZone] = useState(preferences.timeZone ?? browserTimeZone);
  const isCustomTimeZone = COMMON_TIME_ZONES.includes(timeZone) === false;
  const [bodyWeight, setBodyWeight] = useState("");
  const [calorieTarget, setCalorieTarget] = useState(String(nutritionGoals.goals?.calorieTarget ?? ""));
  const [proteinTarget, setProteinTarget] = useState(String(nutritionGoals.goals?.proteinTargetG ?? ""));
  const [carbsTarget, setCarbsTarget] = useState(String(nutritionGoals.goals?.carbsTargetG ?? ""));
  const [fatsTarget, setFatsTarget] = useState(String(nutritionGoals.goals?.fatsTargetG ?? ""));
  const [goalType, setGoalType] = useState<NutritionGoalType>(nutritionGoals.goals?.goalType ?? "MAINTENANCE");
  const [error, setError] = useState("");

  const preferencesMutation = useMutation({
    mutationFn: (payload: { weightUnit: "kg" | "lbs"; defaultRestTargetSeconds: number | null; timeZone: string }) =>
      setUserPreferencesServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = "Could not save preferences.";
        setError(message);
        toast.error(message);
        return;
      }
      setError("");
      queryClient.invalidateQueries({ queryKey: userPreferencesQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["current-workout"] });
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      queryClient.invalidateQueries({ queryKey: ["progression-series"] });
      queryClient.invalidateQueries({ queryKey: ["body-weight-history"] });
      queryClient.invalidateQueries({ queryKey: ["body-weight-series"] });
      toast.success("Preferences saved.");
    },
  });

  const bodyWeightMutation = useMutation({
    mutationFn: (payload: { weight: number; unit: "kg" | "lbs"; recordedAt?: string }) =>
      recordBodyWeightServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = "Could not record body weight.";
        setError(message);
        toast.error(message);
        return;
      }
      setError("");
      setBodyWeight("");
      queryClient.invalidateQueries({ queryKey: bodyWeightSeriesQueryOptions().queryKey });
      toast.success("Bodyweight recorded.");
    },
  });

  const nutritionGoalsMutation = useMutation({
    mutationFn: (payload: {
      calorieTarget: number;
      proteinTargetG: number;
      carbsTargetG: number;
      fatsTargetG: number;
      goalType: NutritionGoalType;
    }) => upsertNutritionGoalsServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.error ?? "Could not save nutrition goals.";
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      queryClient.invalidateQueries({ queryKey: ["nutrition-goals"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-daily-log"] });
      toast.success("Nutrition goals saved.");
    },
  });

  const savePreferences = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = setUserPreferencesInputSchema.safeParse({
      weightUnit: unit,
      defaultRestTargetSeconds: restTarget.trim() === "" ? null : Number(restTarget),
      timeZone,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid preferences.";
      setError(message);
      toast.error(message);
      return;
    }

    preferencesMutation.mutate(parsed.data);
  };

  const submitBodyWeight = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = recordBodyWeightInputSchema.safeParse({
      weight: Number(bodyWeight),
      unit,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid body weight.";
      setError(message);
      toast.error(message);
      return;
    }

    bodyWeightMutation.mutate(parsed.data);
  };

  const submitNutritionGoals = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      calorieTarget: Number(calorieTarget),
      proteinTargetG: Number(proteinTarget),
      carbsTargetG: Number(carbsTarget),
      fatsTargetG: Number(fatsTarget),
      goalType,
    };

    if ([payload.calorieTarget, payload.proteinTargetG, payload.carbsTargetG, payload.fatsTargetG].some(Number.isNaN)) {
      const message = "Enter valid nutrition goal values.";
      setError(message);
      toast.error(message);
      return;
    }

    nutritionGoalsMutation.mutate(payload);
  };

  const latestBodyWeight = bodyWeightSeries[bodyWeightSeries.length - 1];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings & Bodyweight</h1>

      {error && (
        <Card>
          <CardContent className="py-3 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePreferences} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="preference-weight-unit">
                Weight unit
              </label>
              <Select id="preference-weight-unit" value={unit} onChange={(event) => setUnit(event.target.value as "kg" | "lbs")}> 
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="preference-rest-target">
                Default rest target (seconds)
              </label>
              <Input
                id="preference-rest-target"
                type="number"
                min={15}
                max={600}
                value={restTarget}
                onChange={(event) => setRestTarget(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="preference-time-zone">
                Timezone
              </label>
              <Select id="preference-time-zone" value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>
                {COMMON_TIME_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
                {isCustomTimeZone ? (
                  <option value={timeZone}>{timeZone}</option>
                ) : null}
              </Select>
            </div>
            <SaveButton type="submit" disabled={preferencesMutation.isPending} isLoading={preferencesMutation.isPending}>
              Save Preferences
            </SaveButton>
          </form>
          <p className="text-xs text-slate-500 mt-3">Timestamps are stored in UTC and displayed in your selected timezone.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record Bodyweight</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitBodyWeight} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700">Bodyweight ({unit})</label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={bodyWeight}
                onChange={(event) => setBodyWeight(event.target.value)}
              />
            </div>
            <SubmitButton
              type="submit"
              icon="save"
              disabled={bodyWeightMutation.isPending || !bodyWeight.trim()}
              isLoading={bodyWeightMutation.isPending}
              loadingText="Saving...">
              Record
            </SubmitButton>
          </form>

          {latestBodyWeight ? (
            <p className="text-sm text-slate-600 mt-4">
              Latest entry: {formatWeight(latestBodyWeight.weight, latestBodyWeight.weightUnit)} at {" "}
              {formatDateTime(latestBodyWeight.date, { timeZone })}
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-4">No bodyweight entries yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitNutritionGoals} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="nutrition-calories-goal">
                Calorie Target (kcal)
              </label>
              <Input
                id="nutrition-calories-goal"
                type="number"
                value={calorieTarget}
                onChange={(event) => setCalorieTarget(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="nutrition-protein-goal">
                Protein Target (g)
              </label>
              <Input
                id="nutrition-protein-goal"
                type="number"
                value={proteinTarget}
                onChange={(event) => setProteinTarget(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="nutrition-carbs-goal">
                Carbs Target (g)
              </label>
              <Input
                id="nutrition-carbs-goal"
                type="number"
                value={carbsTarget}
                onChange={(event) => setCarbsTarget(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="nutrition-fats-goal">
                Fats Target (g)
              </label>
              <Input
                id="nutrition-fats-goal"
                type="number"
                value={fatsTarget}
                onChange={(event) => setFatsTarget(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="nutrition-goal-type">
                Goal Type
              </label>
              <Select id="nutrition-goal-type" value={goalType} onChange={(event) => setGoalType(event.target.value as NutritionGoalType)}> 
                <option value="CUT">Cut</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BULK">Bulk</option>
              </Select>
            </div>
            <SaveButton type="submit" disabled={nutritionGoalsMutation.isPending} isLoading={nutritionGoalsMutation.isPending}>
              Save Nutrition Goals
            </SaveButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
