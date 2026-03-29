import { AddButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type QuantityUnit = "GRAMS" | "SERVING";

type DailyFoodEntryValues = {
  name: string;
  quantity: string;
  quantityUnit: QuantityUnit;
  proteinG: string;
  carbsG: string;
  fatsG: string;
  caloriesEntered: string;
};

type SavedFood = {
  id: string;
  name: string;
};

type DailyFoodEntryFormCardProps = {
  selectedDate: string;
  selectedFoodId: string;
  savedFoods: SavedFood[];
  values: DailyFoodEntryValues;
  error: string;
  isPending: boolean;
  onDateChange: (value: string) => void;
  onSavedFoodChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityUnitChange: (value: QuantityUnit) => void;
  onCaloriesChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onFatsChange: (value: string) => void;
  onSubmit: () => void;
};

export function DailyFoodEntryFormCard({
  selectedDate,
  selectedFoodId,
  savedFoods,
  values,
  error,
  isPending,
  onDateChange,
  onSavedFoodChange,
  onNameChange,
  onQuantityChange,
  onQuantityUnitChange,
  onCaloriesChange,
  onProteinChange,
  onCarbsChange,
  onFatsChange,
  onSubmit,
}: Readonly<DailyFoodEntryFormCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Food Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="nutrition-date" className="text-sm font-medium text-slate-700">
            Log Date
          </label>
          <Input id="nutrition-date" type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} />
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSubmit();
          }}>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="saved-food">
              Saved Food Defaults
            </label>
            <select
              id="saved-food"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedFoodId}
              onChange={(event) => onSavedFoodChange(event.target.value)}>
              <option value="">Choose a saved food (optional)</option>
              {savedFoods.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-food-name">
              Food Name
            </label>
            <Input id="entry-food-name" value={values.name} onChange={(event) => onNameChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-quantity">
              Quantity
            </label>
            <Input id="entry-quantity" type="number" value={values.quantity} onChange={(event) => onQuantityChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-quantity-unit">
              Quantity Unit
            </label>
            <select
              id="entry-quantity-unit"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={values.quantityUnit}
              onChange={(event) => onQuantityUnitChange(event.target.value as QuantityUnit)}>
              <option value="GRAMS">grams</option>
              <option value="SERVING">serving</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-calories">
              Calories
            </label>
            <Input id="entry-calories" type="number" value={values.caloriesEntered} onChange={(event) => onCaloriesChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-protein">
              Protein (g)
            </label>
            <Input id="entry-protein" type="number" value={values.proteinG} onChange={(event) => onProteinChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-carbs">
              Carbs (g)
            </label>
            <Input id="entry-carbs" type="number" value={values.carbsG} onChange={(event) => onCarbsChange(event.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="entry-fats">
              Fats (g)
            </label>
            <Input id="entry-fats" type="number" value={values.fatsG} onChange={(event) => onFatsChange(event.target.value)} />
          </div>

          <div className="flex items-end">
            <AddButton type="submit" isLoading={isPending} loadingText="Adding..." className="w-full">
              Add Entry
            </AddButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
