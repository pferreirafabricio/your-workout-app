import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/action-buttons";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import {
  createNutritionFoodEntryServerFn,
} from "@/lib/features/nutrition/nutrition.server";
import {
  nutritionDailyLogQueryOptions,
  nutritionDefaultsQueryOptions,
  nutritionFoodsQueryOptions,
  nutritionHistoryQueryOptions,
} from "./-queries/nutrition";
import { toast } from "sonner";

type FoodForm = {
  name: string;
  quantity: string;
  quantityUnit: "GRAMS" | "SERVING";
  proteinG: string;
  carbsG: string;
  fatsG: string;
  caloriesEntered: string;
};

const EMPTY_FOOD: FoodForm = {
  name: "",
  quantity: "",
  quantityUnit: "GRAMS",
  proteinG: "",
  carbsG: "",
  fatsG: "",
  caloriesEntered: "",
};

type SavedFood = {
  id: string;
  name: string;
  defaultQuantity: number;
  quantityUnit: "GRAMS" | "SERVING";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
};

type HistoryPoint = {
  localDate: string;
  caloriesCanonical: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  bodyWeight: number | null;
};

export const Route = createFileRoute("/__index/_layout/nutrition/")({
  loader: async ({ context }) => {
    const defaults = await context.queryClient.ensureQueryData(nutritionDefaultsQueryOptions());
    await Promise.all([
      context.queryClient.ensureQueryData(nutritionDailyLogQueryOptions(defaults.today)),
      context.queryClient.ensureQueryData(nutritionFoodsQueryOptions()),
      context.queryClient.ensureQueryData(
        nutritionHistoryQueryOptions(defaults.historyRange.startDate, defaults.historyRange.endDate, true),
      ),
    ]);
  },
  component: NutritionPage,
});

function NutritionPage() {
  const queryClient = useQueryClient();
  const { data: defaults } = useSuspenseQuery(nutritionDefaultsQueryOptions());
  const foodsQuery = useSuspenseQuery(nutritionFoodsQueryOptions());
  const savedFoods = foodsQuery.data.foods as SavedFood[];

  const [selectedDate, setSelectedDate] = useState(defaults.today);
  const [historyStart, setHistoryStart] = useState(defaults.historyRange.startDate);
  const [historyEnd, setHistoryEnd] = useState(defaults.historyRange.endDate);
  const [includeBodyWeight, setIncludeBodyWeight] = useState(true);
  const [selectedFoodId, setSelectedFoodId] = useState("");

  useSuspenseQuery(nutritionDailyLogQueryOptions(selectedDate));
  const historyQuery = useSuspenseQuery(nutritionHistoryQueryOptions(historyStart, historyEnd, includeBodyWeight));
  const historyPoints = historyQuery.data.points as HistoryPoint[];

  const [error, setError] = useState("");

  const foodForm = useForm({
    defaultValues: EMPTY_FOOD,
    onSubmit: ({ value }) => {
      const parsed = {
        localDate: selectedDate,
        name: value.name.trim(),
        quantity: Number(value.quantity),
        quantityUnit: value.quantityUnit,
        proteinG: Number(value.proteinG),
        carbsG: Number(value.carbsG),
        fatsG: Number(value.fatsG),
        caloriesEntered: Number(value.caloriesEntered),
      };

      if (!parsed.name) {
        setError("Name is required.");
        return;
      }

      if ([parsed.quantity, parsed.proteinG, parsed.carbsG, parsed.fatsG, parsed.caloriesEntered].some(Number.isNaN)) {
        setError("Enter valid numeric values.");
        return;
      }

      createEntryMutation.mutate(parsed);
    },
  });

  const invalidateDaily = async () => {
    await queryClient.invalidateQueries({ queryKey: ["nutrition-daily-log", selectedDate] });
    await queryClient.invalidateQueries({ queryKey: ["nutrition-history", historyStart, historyEnd, includeBodyWeight] });
  };

  const createEntryMutation = useMutation({
    mutationFn: (payload: {
      localDate: string;
      name: string;
      quantity: number;
      quantityUnit: "GRAMS" | "SERVING";
      proteinG: number;
      carbsG: number;
      fatsG: number;
      caloriesEntered: number;
    }) => createNutritionFoodEntryServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: async (response) => {
      if (!response.success) {
        const message = response.error ?? "Failed to create entry.";
        setError(message);
        toast.error(message);
        return;
      }

      response.notices?.forEach((notice) => toast.message(notice.message));
      setSelectedFoodId("");
      foodForm.reset();
      setError("");
      await invalidateDaily();
      toast.success("Food entry added.");
    },
  });

  const applyFoodDefaults = (foodId: string) => {
    setSelectedFoodId(foodId);
    const selectedFood = savedFoods.find((food) => food.id === foodId);
    if (!selectedFood) {
      return;
    }

    foodForm.setFieldValue("name", selectedFood.name);
    foodForm.setFieldValue("quantity", String(selectedFood.defaultQuantity));
    foodForm.setFieldValue("quantityUnit", selectedFood.quantityUnit);
    foodForm.setFieldValue("caloriesEntered", String(selectedFood.calories));
    foodForm.setFieldValue("proteinG", String(selectedFood.proteinG));
    foodForm.setFieldValue("carbsG", String(selectedFood.carbsG));
    foodForm.setFieldValue("fatsG", String(selectedFood.fatsG));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nutrition Daily Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add Food Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="nutrition-date" className="text-sm font-medium text-slate-700">
              Log Date
            </label>
            <Input id="nutrition-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              foodForm.handleSubmit();
            }}>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="saved-food">
                Saved Food Defaults
              </label>
              <select
                id="saved-food"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedFoodId}
                onChange={(e) => applyFoodDefaults(e.target.value)}>
                <option value="">Choose a saved food (optional)</option>
                {savedFoods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}
                  </option>
                ))}
              </select>
            </div>
            <foodForm.Field name="name">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Food Name
                  </label>
                  <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                </div>
              )}
            </foodForm.Field>
            <foodForm.Field name="quantity">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Quantity
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </foodForm.Field>
            <foodForm.Field name="quantityUnit">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Quantity Unit
                  </label>
                  <select
                    id={field.name}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value as "GRAMS" | "SERVING") }>
                    <option value="GRAMS">grams</option>
                    <option value="SERVING">serving</option>
                  </select>
                </div>
              )}
            </foodForm.Field>
            <foodForm.Field name="caloriesEntered">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Calories
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </foodForm.Field>
            <foodForm.Field name="proteinG">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Protein (g)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </foodForm.Field>
            <foodForm.Field name="carbsG">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Carbs (g)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </foodForm.Field>
            <foodForm.Field name="fatsG">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Fats (g)
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </foodForm.Field>
            <div className="flex items-end">
              <AddButton type="submit" isLoading={createEntryMutation.isPending} loadingText="Adding..." className="w-full">
                Add Entry
              </AddButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History Table</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="history-start">
                Start Date
              </label>
              <Input id="history-start" type="date" value={historyStart} onChange={(e) => setHistoryStart(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="history-end">
                End Date
              </label>
              <Input id="history-end" type="date" value={historyEnd} onChange={(e) => setHistoryEnd(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeBodyWeight}
                onChange={(e) => setIncludeBodyWeight(e.target.checked)}
              />
              <span>Include body weight</span>
            </label>
            <Button type="button" variant="outline" onClick={() => historyQuery.refetch()} disabled={historyQuery.isFetching}>
              {historyQuery.isFetching ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {historyQuery.isFetching ? <p className="text-sm text-slate-500">Loading history data...</p> : null}

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Calories</th>
                  <th className="px-3 py-2 text-left">Protein (g)</th>
                  <th className="px-3 py-2 text-left">Carbs (g)</th>
                  <th className="px-3 py-2 text-left">Fats (g)</th>
                  <th className="px-3 py-2 text-left">Bodyweight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {historyPoints.map((point) => (
                  <tr key={point.localDate} className="border-t border-slate-200">
                    <td className="px-3 py-2">{point.localDate}</td>
                    <td className="px-3 py-2">{point.caloriesCanonical}</td>
                    <td className="px-3 py-2">{point.proteinG}</td>
                    <td className="px-3 py-2">{point.carbsG}</td>
                    <td className="px-3 py-2">{point.fatsG}</td>
                    <td className="px-3 py-2">{includeBodyWeight ? (point.bodyWeight ?? "-") : "hidden"}</td>
                  </tr>
                ))}
                {historyPoints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-slate-500">
                      No historical data in this range.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>
    </div>
  );
}
