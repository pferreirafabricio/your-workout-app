import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCsrfHeaders } from "@/lib/csrf.client";
import {
  createNutritionFoodServerFn,
  deleteNutritionFoodServerFn,
  updateNutritionFoodServerFn,
} from "@/lib/features/nutrition/nutrition.server";
import { nutritionFoodsQueryOptions } from "./_layout.nutrition/-queries/nutrition";
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

export const Route = createFileRoute("/__index/_layout/nutrition/foods")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(nutritionFoodsQueryOptions());
  },
  component: NutritionFoodsPage,
});

function NutritionFoodsPage() {
  const queryClient = useQueryClient();
  const foodsQuery = useSuspenseQuery(nutritionFoodsQueryOptions());
  const foods = foodsQuery.data.foods as SavedFood[];

  const [form, setForm] = useState<FoodForm>(EMPTY_FOOD);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      setForm(EMPTY_FOOD);
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
      setForm(EMPTY_FOOD);
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
        setForm(EMPTY_FOOD);
      }
      await queryClient.invalidateQueries({ queryKey: ["nutrition-foods"] });
      toast.success("Saved food deleted.");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      defaultQuantity: Number(form.defaultQuantity),
      quantityUnit: form.quantityUnit,
      calories: Number(form.calories),
      proteinG: Number(form.proteinG),
      carbsG: Number(form.carbsG),
      fatsG: Number(form.fatsG),
    };

    if (!payload.name) {
      setError("Name is required.");
      return;
    }

    if (
      [
        payload.defaultQuantity,
        payload.calories,
        payload.proteinG,
        payload.carbsG,
        payload.fatsG,
      ].some(Number.isNaN)
    ) {
      setError("Enter valid numeric values.");
      return;
    }

    if (editingFoodId) {
      updateMutation.mutate({ foodId: editingFoodId, ...payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const onEdit = (food: SavedFood) => {
    setEditingFoodId(food.id);
    setForm({
      name: food.name,
      defaultQuantity: String(food.defaultQuantity),
      quantityUnit: food.quantityUnit,
      calories: String(food.calories),
      proteinG: String(food.proteinG),
      carbsG: String(food.carbsG),
      fatsG: String(food.fatsG),
    });
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
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-name">
                Food Name
              </label>
              <Input id="food-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-default-quantity">
                Default Quantity
              </label>
              <Input
                id="food-default-quantity"
                type="number"
                value={form.defaultQuantity}
                onChange={(e) => setForm((p) => ({ ...p, defaultQuantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-unit">
                Quantity Unit
              </label>
              <select
                id="food-unit"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={form.quantityUnit}
                onChange={(e) => setForm((p) => ({ ...p, quantityUnit: e.target.value as "GRAMS" | "SERVING" }))}>
                <option value="GRAMS">grams</option>
                <option value="SERVING">serving</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-calories">
                Calories
              </label>
              <Input
                id="food-calories"
                type="number"
                value={form.calories}
                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-protein">
                Protein (g)
              </label>
              <Input
                id="food-protein"
                type="number"
                value={form.proteinG}
                onChange={(e) => setForm((p) => ({ ...p, proteinG: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-carbs">
                Carbs (g)
              </label>
              <Input
                id="food-carbs"
                type="number"
                value={form.carbsG}
                onChange={(e) => setForm((p) => ({ ...p, carbsG: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="food-fats">
                Fats (g)
              </label>
              <Input
                id="food-fats"
                type="number"
                value={form.fatsG}
                onChange={(e) => setForm((p) => ({ ...p, fatsG: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                {editingFoodId ? "Save Changes" : "Create Food"}
              </Button>
              {editingFoodId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingFoodId(null);
                    setForm(EMPTY_FOOD);
                  }}>
                  Cancel
                </Button>
              ) : null}
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
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(food)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(food.id)}>
                          Delete
                        </Button>
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
