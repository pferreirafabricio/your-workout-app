import { SubmitButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatWeight } from "@/lib/shared/utils";

type BodyWeightPoint = {
  date: string | Date;
  weight: number;
  weightUnit: "kg" | "lbs";
};

type BodyweightFormCardProps = {
  bodyWeight: string;
  weightUnit: "kg" | "lbs";
  selectedTimeZone: string;
  latestBodyWeight: BodyWeightPoint | undefined;
  isPending: boolean;
  onBodyWeightChange: (value: string) => void;
  onSubmit: () => void;
};

export function BodyweightFormCard({
  bodyWeight,
  weightUnit,
  selectedTimeZone,
  latestBodyWeight,
  isPending,
  onBodyWeightChange,
  onSubmit,
}: Readonly<BodyweightFormCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Bodyweight</CardTitle>
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
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-bodyweight-input">
              Bodyweight ({weightUnit})
            </label>
            <Input
              id="settings-bodyweight-input"
              type="number"
              min={1}
              max={1000}
              value={bodyWeight}
              onChange={(event) => onBodyWeightChange(event.target.value)}
            />
          </div>

          <SubmitButton
            type="submit"
            icon="save"
            disabled={isPending || !bodyWeight.trim()}
            isLoading={isPending}
            loadingText="Saving...">
            Record
          </SubmitButton>
        </form>

        {latestBodyWeight ? (
          <p className="text-sm text-slate-600 mt-4">
            Latest entry: {formatWeight(latestBodyWeight.weight, latestBodyWeight.weightUnit)} at{" "}
            {formatDateTime(latestBodyWeight.date, { timeZone: selectedTimeZone })}
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-4">No bodyweight entries yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
