import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveButton, SubmitButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bodyWeightSeriesQueryOptions, userPreferencesQueryOptions } from "../_layout.current-workout/-queries/current-workout";
import { recordBodyWeightServerFn, setUserPreferencesServerFn } from "@/lib/features/workouts/workouts.server";
import { recordBodyWeightInputSchema, setUserPreferencesInputSchema } from "@/lib/features/workouts/workout-progression";
import { nutritionGoalsQueryOptions } from "../_layout.nutrition/-queries/nutrition";
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

export const Route = createFileRoute("/__index/_layout/settings/")({
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

  const [error, setError] = useState("");

  const preferencesForm = useForm({
    defaultValues: {
      weightUnit: preferences.weightUnit,
      defaultRestTargetSeconds: String(preferences.defaultRestTargetSeconds ?? 120),
      timeZone: preferences.timeZone ?? browserTimeZone,
    },
    onSubmit: ({ value }) => {
      const parsed = setUserPreferencesInputSchema.safeParse({
        weightUnit: value.weightUnit,
        defaultRestTargetSeconds: value.defaultRestTargetSeconds.trim() === "" ? null : Number(value.defaultRestTargetSeconds),
        timeZone: value.timeZone,
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid preferences.";
        setError(message);
        toast.error(message);
        return;
      }

      preferencesMutation.mutate(parsed.data);
    },
  });

  const bodyWeightForm = useForm({
    defaultValues: {
      bodyWeight: "",
    },
    onSubmit: ({ value }) => {
      const parsed = recordBodyWeightInputSchema.safeParse({
        weight: Number(value.bodyWeight),
        unit: preferencesForm.state.values.weightUnit,
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid body weight.";
        setError(message);
        toast.error(message);
        return;
      }

      bodyWeightMutation.mutate(parsed.data);
    },
  });

  const nutritionGoalsForm = useForm({
    defaultValues: {
      calorieTarget: String(nutritionGoals.goals?.calorieTarget ?? ""),
      proteinTargetG: String(nutritionGoals.goals?.proteinTargetG ?? ""),
      carbsTargetG: String(nutritionGoals.goals?.carbsTargetG ?? ""),
      fatsTargetG: String(nutritionGoals.goals?.fatsTargetG ?? ""),
      goalType: (nutritionGoals.goals?.goalType ?? "MAINTENANCE") as NutritionGoalType,
    },
    onSubmit: ({ value }) => {
      const payload = {
        calorieTarget: Number(value.calorieTarget),
        proteinTargetG: Number(value.proteinTargetG),
        carbsTargetG: Number(value.carbsTargetG),
        fatsTargetG: Number(value.fatsTargetG),
        goalType: value.goalType,
      };

      if ([payload.calorieTarget, payload.proteinTargetG, payload.carbsTargetG, payload.fatsTargetG].some(Number.isNaN)) {
        const message = "Enter valid nutrition goal values.";
        setError(message);
        toast.error(message);
        return;
      }

      nutritionGoalsMutation.mutate(payload);
    },
  });

  const isCustomTimeZone = COMMON_TIME_ZONES.includes(preferencesForm.state.values.timeZone) === false;

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
      bodyWeightForm.reset();
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

  const latestBodyWeight = bodyWeightSeries.at(-1);

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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              preferencesForm.handleSubmit();
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <preferencesForm.Field name="weightUnit">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Weight unit
                  </label>
                  <Select id={field.name} value={field.state.value} onChange={(event) => field.handleChange(event.target.value as "kg" | "lbs")}> 
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </Select>
                </div>
              )}
            </preferencesForm.Field>
            <preferencesForm.Field name="defaultRestTargetSeconds">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Default rest target (seconds)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    min={15}
                    max={600}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </preferencesForm.Field>
            <preferencesForm.Field name="timeZone">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Timezone
                  </label>
                  <Select id={field.name} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)}>
                    {COMMON_TIME_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                    {isCustomTimeZone ? (
                      <option value={preferencesForm.state.values.timeZone}>{preferencesForm.state.values.timeZone}</option>
                    ) : null}
                  </Select>
                </div>
              )}
            </preferencesForm.Field>
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              bodyWeightForm.handleSubmit();
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <bodyWeightForm.Field name="bodyWeight">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700">Bodyweight ({preferencesForm.state.values.weightUnit})</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </bodyWeightForm.Field>
            <bodyWeightForm.Subscribe selector={(state) => state.values.bodyWeight}>
              {(bodyWeight) => (
                <SubmitButton
                  type="submit"
                  icon="save"
                  disabled={bodyWeightMutation.isPending || !bodyWeight.trim()}
                  isLoading={bodyWeightMutation.isPending}
                  loadingText="Saving...">
                  Record
                </SubmitButton>
              )}
            </bodyWeightForm.Subscribe>
          </form>

          {latestBodyWeight ? (
            <p className="text-sm text-slate-600 mt-4">
              Latest entry: {formatWeight(latestBodyWeight.weight, latestBodyWeight.weightUnit)} at {" "}
              {formatDateTime(latestBodyWeight.date, { timeZone: preferencesForm.state.values.timeZone })}
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              nutritionGoalsForm.handleSubmit();
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <nutritionGoalsForm.Field name="calorieTarget">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Calorie Target (kcal)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </nutritionGoalsForm.Field>
            <nutritionGoalsForm.Field name="proteinTargetG">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Protein Target (g)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </nutritionGoalsForm.Field>
            <nutritionGoalsForm.Field name="carbsTargetG">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Carbs Target (g)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </nutritionGoalsForm.Field>
            <nutritionGoalsForm.Field name="fatsTargetG">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Fats Target (g)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </nutritionGoalsForm.Field>
            <nutritionGoalsForm.Field name="goalType">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Goal Type
                  </label>
                  <Select id={field.name} value={field.state.value} onChange={(event) => field.handleChange(event.target.value as NutritionGoalType)}> 
                    <option value="CUT">Cut</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="BULK">Bulk</option>
                  </Select>
                </div>
              )}
            </nutritionGoalsForm.Field>
            <SaveButton type="submit" disabled={nutritionGoalsMutation.isPending} isLoading={nutritionGoalsMutation.isPending}>
              Save Nutrition Goals
            </SaveButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
