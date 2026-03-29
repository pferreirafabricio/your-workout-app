import {
  Calendar,
  ClipboardPen,
  Droplets,
  Flame,
  Hourglass,
  Scale,
  Utensils,
  Wheat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DailyTotals = {
  caloriesCanonical: number;
  caloriesEntered: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
};

type GoalContext = {
  hasGoals: boolean;
  balanceCalories?: number;
  balanceLabel?: string;
  remainingCalories?: number;
};

type CaloriesMacrosOverviewProps = {
  selectedDate: string;
  totals: DailyTotals;
  goalContext: GoalContext;
  onDateChange: (value: string) => void;
};

export function CaloriesMacrosOverview({
  selectedDate,
  totals,
  goalContext,
  onDateChange,
}: Readonly<CaloriesMacrosOverviewProps>) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Calories & Macros</h1>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm w-fit">
          <Calendar className="w-4 h-4 text-slate-500" />
          <Input
            id="summary-date"
            type="date"
            className="border-0 p-0 h-auto focus-visible:ring-0 w-[130px] text-sm"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Consumed Calories</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totals.caloriesCanonical} kcal</div>
            <p className="text-xs text-slate-500 mt-1">Canonical from macros</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Entered Calories</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardPen className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totals.caloriesEntered} kcal</div>
            <p className="text-xs text-slate-500 mt-1">Manual values from entries</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Balance</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {goalContext.hasGoals ? (
              <>
                <div className="text-2xl font-bold text-slate-900">{goalContext.balanceCalories} kcal</div>
                <p className="text-xs text-slate-500 mt-1">{goalContext.balanceLabel}</p>
              </>
            ) : (
              <p className="text-xs text-amber-700 italic">Set goals in Settings</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Remaining</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Hourglass className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            {goalContext.hasGoals ? (
              <>
                <div className="text-2xl font-bold text-slate-900">{goalContext.remainingCalories} kcal</div>
                <p className="text-xs text-slate-500 mt-1">Against your daily target</p>
              </>
            ) : (
              <p className="text-xs text-amber-700 italic">Set goals in Settings</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Protein</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <Utensils className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totals.proteinG} g</div>
            <p className="text-xs text-slate-500 mt-1">{totals.proteinPct}% of calories</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Carbs</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Wheat className="w-4 h-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totals.carbsG} g</div>
            <p className="text-xs text-slate-500 mt-1">{totals.carbsPct}% of calories</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Fats</CardTitle>
            <div className="p-2 bg-sky-100 rounded-lg">
              <Droplets className="w-4 h-4 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totals.fatsG} g</div>
            <p className="text-xs text-slate-500 mt-1">{totals.fatsPct}% of calories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
