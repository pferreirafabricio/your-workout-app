import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveButton, SubmitButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bodyWeightSeriesQueryOptions, userPreferencesQueryOptions } from "./_layout.current-workout/-queries/current-workout";
import { recordBodyWeightServerFn, setUserPreferencesServerFn } from "@/lib/workouts.server";
import { recordBodyWeightInputSchema, setUserPreferencesInputSchema } from "@/lib/validation/workout-progression";
import { formatDateTime, formatWeight } from "@/lib/utils";
import { getCsrfHeaders } from "@/lib/csrf.client";

export const Route = createFileRoute("/__index/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(userPreferencesQueryOptions()),
      context.queryClient.ensureQueryData(bodyWeightSeriesQueryOptions()),
    ]);
  },
  component: IndexPage,
});

function IndexPage() {
  const queryClient = useQueryClient();
  const { data: preferences } = useSuspenseQuery(userPreferencesQueryOptions());
  const { data: bodyWeightSeries } = useSuspenseQuery(bodyWeightSeriesQueryOptions());

  const [unit, setUnit] = useState<"kg" | "lbs">(preferences.weightUnit);
  const [restTarget, setRestTarget] = useState(String(preferences.defaultRestTargetSeconds ?? 120));
  const [bodyWeight, setBodyWeight] = useState("");
  const [error, setError] = useState("");

  const preferencesMutation = useMutation({
    mutationFn: (payload: { weightUnit: "kg" | "lbs"; defaultRestTargetSeconds: number | null }) =>
      setUserPreferencesServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        setError("Could not save preferences.");
        return;
      }
      setError("");
      queryClient.invalidateQueries({ queryKey: userPreferencesQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["current-workout"] });
    },
  });

  const bodyWeightMutation = useMutation({
    mutationFn: (payload: { weight: number; unit: "kg" | "lbs"; recordedAt?: string }) =>
      recordBodyWeightServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        setError("Could not record body weight.");
        return;
      }
      setError("");
      setBodyWeight("");
      queryClient.invalidateQueries({ queryKey: bodyWeightSeriesQueryOptions().queryKey });
    },
  });

  const savePreferences = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = setUserPreferencesInputSchema.safeParse({
      weightUnit: unit,
      defaultRestTargetSeconds: restTarget.trim() === "" ? null : Number(restTarget),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid preferences.");
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
      setError(parsed.error.issues[0]?.message ?? "Invalid body weight.");
      return;
    }

    bodyWeightMutation.mutate(parsed.data);
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
          <form onSubmit={savePreferences} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700">Weight unit</label>
              <Select value={unit} onChange={(event) => setUnit(event.target.value as "kg" | "lbs")}> 
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Default rest target (seconds)</label>
              <Input type="number" min={15} max={600} value={restTarget} onChange={(event) => setRestTarget(event.target.value)} />
            </div>
            <SaveButton type="submit" disabled={preferencesMutation.isPending} isLoading={preferencesMutation.isPending}>
              Save Preferences
            </SaveButton>
          </form>
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
              {formatDateTime(latestBodyWeight.date)}
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-4">No bodyweight entries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
