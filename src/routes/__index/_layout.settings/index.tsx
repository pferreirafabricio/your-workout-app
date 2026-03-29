import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent } from "@/components/ui/card";
import { bodyWeightSeriesQueryOptions, userPreferencesQueryOptions } from "../_layout.current-workout/-queries/current-workout";
import { recordBodyWeightServerFn, setUserPreferencesServerFn } from "@/lib/features/workouts/workouts.server";
import { recordBodyWeightInputSchema, setUserPreferencesInputSchema } from "@/lib/features/workouts/workouts.validation";
import { nutritionGoalsQueryOptions } from "../_layout.nutrition/-queries/nutrition";
import { upsertNutritionGoalsServerFn } from "@/lib/features/nutrition/nutrition.server";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { toast } from "sonner";
import {
  BodyweightFormCard,
  NutritionGoalsFormCard,
  PreferencesFormCard,
  type NutritionGoalType,
} from "@/components/features/settings";

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

      <preferencesForm.Subscribe selector={(state) => state.values}>
        {(values) => (
          <PreferencesFormCard
            values={values}
            commonTimeZones={COMMON_TIME_ZONES}
            isCustomTimeZone={isCustomTimeZone}
            isPending={preferencesMutation.isPending}
            onWeightUnitChange={(value) => preferencesForm.setFieldValue("weightUnit", value)}
            onDefaultRestTargetSecondsChange={(value) => preferencesForm.setFieldValue("defaultRestTargetSeconds", value)}
            onTimeZoneChange={(value) => preferencesForm.setFieldValue("timeZone", value)}
            onSubmit={() => preferencesForm.handleSubmit()}
          />
        )}
      </preferencesForm.Subscribe>

      <bodyWeightForm.Subscribe selector={(state) => state.values.bodyWeight}>
        {(bodyWeight) => (
          <BodyweightFormCard
            bodyWeight={bodyWeight}
            weightUnit={preferencesForm.state.values.weightUnit}
            selectedTimeZone={preferencesForm.state.values.timeZone}
            latestBodyWeight={latestBodyWeight}
            isPending={bodyWeightMutation.isPending}
            onBodyWeightChange={(value) => bodyWeightForm.setFieldValue("bodyWeight", value)}
            onSubmit={() => bodyWeightForm.handleSubmit()}
          />
        )}
      </bodyWeightForm.Subscribe>

      <nutritionGoalsForm.Subscribe selector={(state) => state.values}>
        {(values) => (
          <NutritionGoalsFormCard
            values={values as {
              calorieTarget: string;
              proteinTargetG: string;
              carbsTargetG: string;
              fatsTargetG: string;
              goalType: NutritionGoalType;
            }}
            isPending={nutritionGoalsMutation.isPending}
            onCalorieTargetChange={(value) => nutritionGoalsForm.setFieldValue("calorieTarget", value)}
            onProteinTargetChange={(value) => nutritionGoalsForm.setFieldValue("proteinTargetG", value)}
            onCarbsTargetChange={(value) => nutritionGoalsForm.setFieldValue("carbsTargetG", value)}
            onFatsTargetChange={(value) => nutritionGoalsForm.setFieldValue("fatsTargetG", value)}
            onGoalTypeChange={(value) => nutritionGoalsForm.setFieldValue("goalType", value)}
            onSubmit={() => nutritionGoalsForm.handleSubmit()}
          />
        )}
      </nutritionGoalsForm.Subscribe>
    </div>
  );
}
