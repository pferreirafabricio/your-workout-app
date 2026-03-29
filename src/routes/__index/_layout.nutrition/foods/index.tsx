import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import {
  createNutritionFoodServerFn,
  deleteNutritionFoodServerFn,
  updateNutritionFoodServerFn,
} from "@/lib/features/nutrition/nutrition.server";
import { nutritionFoodsQueryOptions } from "../-queries/nutrition";
import { toast } from "sonner";
import {
  SavedFoodFormCard,
  SavedFoodsTableCard,
} from "@/components/features/nutrition";

type FoodForm = {
  name: string;
  defaultQuantity: string;
  quantityUnit: "GRAMS" | "SERVING";
  calories: string;
  proteinG: string;
  carbsG: string;
  fatsG: string;
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

const EMPTY_FOOD: FoodForm = {
  name: "",
  defaultQuantity: "",
  quantityUnit: "GRAMS",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatsG: "",
};

export const Route = createFileRoute("/__index/_layout/nutrition/foods/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(nutritionFoodsQueryOptions());
  },
  component: NutritionFoodsPage,
});

function NutritionFoodsPage() {
  const queryClient = useQueryClient();
  const foodsQuery = useSuspenseQuery(nutritionFoodsQueryOptions());
  const foods = foodsQuery.data.foods as SavedFood[];

  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const form = useForm({
    defaultValues: EMPTY_FOOD,
    onSubmit: ({ value }) => {
      const payload = {
        name: value.name.trim(),
        defaultQuantity: Number(value.defaultQuantity),
        quantityUnit: value.quantityUnit,
        calories: Number(value.calories),
        proteinG: Number(value.proteinG),
        carbsG: Number(value.carbsG),
        fatsG: Number(value.fatsG),
      };

      if (!payload.name) {
        setError("Name is required.");
        return;
      }

      if ([payload.defaultQuantity, payload.calories, payload.proteinG, payload.carbsG, payload.fatsG].some(Number.isNaN)) {
        setError("Enter valid numeric values.");
        return;
      }

      if (editingFoodId) {
        updateMutation.mutate({ foodId: editingFoodId, ...payload });
        return;
      }

      createMutation.mutate(payload);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      defaultQuantity: number;
      quantityUnit: "GRAMS" | "SERVING";
      calories: number;
      proteinG: number;
      carbsG: number;
      fatsG: number;
    }) => createNutritionFoodServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: async (response) => {
      if (!response.success) {
        const message = response.error ?? "Could not create food.";
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["nutrition-foods"] });
      toast.success("Saved food created.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      foodId: string;
      name: string;
      defaultQuantity: number;
      quantityUnit: "GRAMS" | "SERVING";
      calories: number;
      proteinG: number;
      carbsG: number;
      fatsG: number;
    }) => updateNutritionFoodServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: async (response) => {
      if (!response.success) {
        const message = response.error ?? "Could not update food.";
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      form.reset();
      setEditingFoodId(null);
      await queryClient.invalidateQueries({ queryKey: ["nutrition-foods"] });
      toast.success("Saved food updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (foodId: string) => deleteNutritionFoodServerFn({ data: { foodId }, headers: getCsrfHeaders() }),
    onSuccess: async (response) => {
      if (!response.success) {
        const message = response.error ?? "Could not delete food.";
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      if (editingFoodId) {
        setEditingFoodId(null);
        form.reset();
      }
      await queryClient.invalidateQueries({ queryKey: ["nutrition-foods"] });
      toast.success("Saved food deleted.");
    },
  });

  const onEdit = (food: SavedFood) => {
    setEditingFoodId(food.id);
    form.setFieldValue("name", food.name);
    form.setFieldValue("defaultQuantity", String(food.defaultQuantity));
    form.setFieldValue("quantityUnit", food.quantityUnit);
    form.setFieldValue("calories", String(food.calories));
    form.setFieldValue("proteinG", String(food.proteinG));
    form.setFieldValue("carbsG", String(food.carbsG));
    form.setFieldValue("fatsG", String(food.fatsG));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nutrition Foods</h1>

      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <SavedFoodFormCard
            editing={editingFoodId !== null}
            values={values}
            error={error}
            isCreatePending={createMutation.isPending}
            isUpdatePending={updateMutation.isPending}
            onNameChange={(value) => form.setFieldValue("name", value)}
            onDefaultQuantityChange={(value) => form.setFieldValue("defaultQuantity", value)}
            onQuantityUnitChange={(value) => form.setFieldValue("quantityUnit", value)}
            onCaloriesChange={(value) => form.setFieldValue("calories", value)}
            onProteinChange={(value) => form.setFieldValue("proteinG", value)}
            onCarbsChange={(value) => form.setFieldValue("carbsG", value)}
            onFatsChange={(value) => form.setFieldValue("fatsG", value)}
            onSubmit={() => form.handleSubmit()}
            onCancelEdit={() => {
              setEditingFoodId(null);
              form.reset();
            }}
          />
        )}
      </form.Subscribe>

      <SavedFoodsTableCard
        foods={foods}
        isDeletePending={deleteMutation.isPending}
        onEdit={onEdit}
        onDelete={(foodId) => deleteMutation.mutate(foodId)}
      />
    </div>
  );
}
