import { AddButton, CancelButton, SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type QuantityUnit = "GRAMS" | "SERVING";

type SavedFoodFormValues = {
  name: string;
  defaultQuantity: string;
  quantityUnit: QuantityUnit;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatsG: string;
};

type SavedFoodFormCardProps = {
  editing: boolean;
  values: SavedFoodFormValues;
  error: string;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  onNameChange: (value: string) => void;
  onDefaultQuantityChange: (value: string) => void;
  onQuantityUnitChange: (value: QuantityUnit) => void;
  onCaloriesChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onFatsChange: (value: string) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export function SavedFoodFormCard({
  editing,
  values,
  error,
  isCreatePending,
  isUpdatePending,
  onNameChange,
  onDefaultQuantityChange,
  onQuantityUnitChange,
  onCaloriesChange,
  onProteinChange,
  onCarbsChange,
  onFatsChange,
  onSubmit,
  onCancelEdit,
}: Readonly<SavedFoodFormCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Edit Saved Food" : "Create Saved Food"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSubmit();
          }}>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-name">
              Food Name
            </label>
            <Input id="saved-food-name" value={values.name} onChange={(event) => onNameChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-quantity">
              Default Quantity
            </label>
            <Input
              id="saved-food-quantity"
              type="number"
              value={values.defaultQuantity}
              onChange={(event) => onDefaultQuantityChange(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-quantity-unit">
              Quantity Unit
            </label>
            <select
              id="saved-food-quantity-unit"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={values.quantityUnit}
              onChange={(event) => onQuantityUnitChange(event.target.value as QuantityUnit)}>
              <option value="GRAMS">grams</option>
              <option value="SERVING">serving</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-calories">
              Calories
            </label>
            <Input id="saved-food-calories" type="number" value={values.calories} onChange={(event) => onCaloriesChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-protein">
              Protein (g)
            </label>
            <Input id="saved-food-protein" type="number" value={values.proteinG} onChange={(event) => onProteinChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-carbs">
              Carbs (g)
            </label>
            <Input id="saved-food-carbs" type="number" value={values.carbsG} onChange={(event) => onCarbsChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food-fats">
              Fats (g)
            </label>
            <Input id="saved-food-fats" type="number" value={values.fatsG} onChange={(event) => onFatsChange(event.target.value)} />
          </div>

          <div className="flex items-end gap-2">
            {editing ? (
              <>
                <SaveButton type="submit" isLoading={isUpdatePending} className="w-full">
                  Save Changes
                </SaveButton>
                <CancelButton type="button" variant="outline" onClick={onCancelEdit} />
              </>
            ) : (
              <AddButton type="submit" isLoading={isCreatePending} className="w-full">
                Create Food
              </AddButton>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
