import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
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
import {
  DailyFoodEntryFormCard,
  NutritionHistoryTableCard,
} from "@/components/features/nutrition";

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

      <foodForm.Subscribe selector={(state) => state.values}>
        {(values) => (
          <DailyFoodEntryFormCard
            selectedDate={selectedDate}
            selectedFoodId={selectedFoodId}
            savedFoods={savedFoods}
            values={values}
            error={error}
            isPending={createEntryMutation.isPending}
            onDateChange={setSelectedDate}
            onSavedFoodChange={applyFoodDefaults}
            onNameChange={(value) => foodForm.setFieldValue("name", value)}
            onQuantityChange={(value) => foodForm.setFieldValue("quantity", value)}
            onQuantityUnitChange={(value) => foodForm.setFieldValue("quantityUnit", value)}
            onCaloriesChange={(value) => foodForm.setFieldValue("caloriesEntered", value)}
            onProteinChange={(value) => foodForm.setFieldValue("proteinG", value)}
            onCarbsChange={(value) => foodForm.setFieldValue("carbsG", value)}
            onFatsChange={(value) => foodForm.setFieldValue("fatsG", value)}
            onSubmit={() => foodForm.handleSubmit()}
          />
        )}
      </foodForm.Subscribe>

      <NutritionHistoryTableCard
        historyStart={historyStart}
        historyEnd={historyEnd}
        includeBodyWeight={includeBodyWeight}
        historyPoints={historyPoints}
        isFetching={historyQuery.isFetching}
        onHistoryStartChange={setHistoryStart}
        onHistoryEndChange={setHistoryEnd}
        onIncludeBodyWeightChange={setIncludeBodyWeight}
        onRefresh={() => {
          void historyQuery.refetch();
        }}
      />
    </div>
  );
}
