import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AddButton, CancelButton, DeleteButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import {
  createNutritionFoodServerFn,
  deleteNutritionFoodServerFn,
  updateNutritionFoodServerFn,
} from "@/lib/features/nutrition/nutrition.server";
import { nutritionFoodsQueryOptions } from "../-queries/nutrition";
import { toast } from "sonner";

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

      <Card>
        <CardHeader>
          <CardTitle>{editingFoodId ? "Edit Saved Food" : "Create Saved Food"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}>
            <form.Field name="name">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Food Name
                  </label>
                  <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                </div>
              )}
            </form.Field>
            <form.Field name="defaultQuantity">
              {(field) => (
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                    Default Quantity
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
            </form.Field>
            <form.Field name="quantityUnit">
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
            </form.Field>
            <form.Field name="calories">
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
            </form.Field>
            <form.Field name="proteinG">
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
            </form.Field>
            <form.Field name="carbsG">
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
            </form.Field>
            <form.Field name="fatsG">
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
            </form.Field>
            <div className="flex items-end gap-2">
              {editingFoodId ? (
                <>
                  <SaveButton type="submit" isLoading={updateMutation.isPending} className="w-full">
                    Save Changes
                  </SaveButton>
                  <CancelButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingFoodId(null);
                      form.reset();
                    }}
                  />
                </>
              ) : (
                <AddButton type="submit" isLoading={createMutation.isPending} className="w-full">
                  Create Food
                </AddButton>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Foods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                  <th className="px-3 py-2 text-left">Calories</th>
                  <th className="px-3 py-2 text-left">Protein</th>
                  <th className="px-3 py-2 text-left">Carbs</th>
                  <th className="px-3 py-2 text-left">Fats</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr key={food.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{food.name}</td>
                    <td className="px-3 py-2">
                      {food.defaultQuantity} {food.quantityUnit.toLowerCase()}
                    </td>
                    <td className="px-3 py-2">{food.calories}</td>
                    <td className="px-3 py-2">{food.proteinG}</td>
                    <td className="px-3 py-2">{food.carbsG}</td>
                    <td className="px-3 py-2">{food.fatsG}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <EditButton
                          type="button"
                          variant="ghost"
                          size="icon"
                          iconOnly
                          onClick={() => onEdit(food)}
                        />
                        <DeleteButton
                          type="button"
                          variant="ghost"
                          size="icon"
                          iconOnly
                          disabled={deleteMutation.isPending}
                          isLoading={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(food.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {foods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-3 text-slate-500">
                      No saved foods yet.
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
