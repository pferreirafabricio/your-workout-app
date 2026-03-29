import { SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type NutritionGoalType = "CUT" | "MAINTENANCE" | "BULK";

type NutritionGoalsValues = {
  calorieTarget: string;
  proteinTargetG: string;
  carbsTargetG: string;
  fatsTargetG: string;
  goalType: NutritionGoalType;
};

type NutritionGoalsFormCardProps = {
  values: NutritionGoalsValues;
  isPending: boolean;
  onCalorieTargetChange: (value: string) => void;
  onProteinTargetChange: (value: string) => void;
  onCarbsTargetChange: (value: string) => void;
  onFatsTargetChange: (value: string) => void;
  onGoalTypeChange: (value: NutritionGoalType) => void;
  onSubmit: () => void;
};

export function NutritionGoalsFormCard({
  values,
  isPending,
  onCalorieTargetChange,
  onProteinTargetChange,
  onCarbsTargetChange,
  onFatsTargetChange,
  onGoalTypeChange,
  onSubmit,
}: Readonly<NutritionGoalsFormCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSubmit();
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-calorie-target">
              Calorie Target (kcal)
            </label>
            <Input
              id="settings-calorie-target"
              type="number"
              value={values.calorieTarget}
              onChange={(event) => onCalorieTargetChange(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-protein-target">
              Protein Target (g)
            </label>
            <Input
              id="settings-protein-target"
              type="number"
              value={values.proteinTargetG}
              onChange={(event) => onProteinTargetChange(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-carbs-target">
              Carbs Target (g)
            </label>
            <Input
              id="settings-carbs-target"
              type="number"
              value={values.carbsTargetG}
              onChange={(event) => onCarbsTargetChange(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-fats-target">
              Fats Target (g)
            </label>
            <Input
              id="settings-fats-target"
              type="number"
              value={values.fatsTargetG}
              onChange={(event) => onFatsTargetChange(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-goal-type">
              Goal Type
            </label>
            <Select
              id="settings-goal-type"
              value={values.goalType}
              onChange={(event) => onGoalTypeChange(event.target.value as NutritionGoalType)}>
              <option value="CUT">Cut</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="BULK">Bulk</option>
            </Select>
          </div>

          <SaveButton type="submit" disabled={isPending} isLoading={isPending}>
            Save Nutrition Goals
          </SaveButton>
        </form>
      </CardContent>
    </Card>
  );
}
