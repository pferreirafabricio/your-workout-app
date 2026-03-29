import { DeleteButton, EditButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type SavedFoodsTableCardProps = {
  foods: SavedFood[];
  isDeletePending: boolean;
  onEdit: (food: SavedFood) => void;
  onDelete: (foodId: string) => void;
};

export function SavedFoodsTableCard({ foods, isDeletePending, onEdit, onDelete }: Readonly<SavedFoodsTableCardProps>) {
  return (
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
                      <EditButton type="button" variant="ghost" size="icon" iconOnly onClick={() => onEdit(food)} />
                      <DeleteButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        iconOnly
                        disabled={isDeletePending}
                        isLoading={isDeletePending}
                        onClick={() => onDelete(food.id)}
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
  );
}
