import { SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PreferencesValues = {
  weightUnit: "kg" | "lbs";
  defaultRestTargetSeconds: string;
  timeZone: string;
};

type PreferencesFormCardProps = {
  values: PreferencesValues;
  commonTimeZones: string[];
  isCustomTimeZone: boolean;
  isPending: boolean;
  onWeightUnitChange: (value: "kg" | "lbs") => void;
  onDefaultRestTargetSecondsChange: (value: string) => void;
  onTimeZoneChange: (value: string) => void;
  onSubmit: () => void;
};

export function PreferencesFormCard({
  values,
  commonTimeZones,
  isCustomTimeZone,
  isPending,
  onWeightUnitChange,
  onDefaultRestTargetSecondsChange,
  onTimeZoneChange,
  onSubmit,
}: Readonly<PreferencesFormCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSubmit();
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-weight-unit">
              Weight unit
            </label>
            <Select
              id="settings-weight-unit"
              value={values.weightUnit}
              onChange={(event) => onWeightUnitChange(event.target.value as "kg" | "lbs") }>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-default-rest-target">
              Default rest target (seconds)
            </label>
            <Input
              id="settings-default-rest-target"
              type="number"
              min={15}
              max={600}
              value={values.defaultRestTargetSeconds}
              onChange={(event) => onDefaultRestTargetSecondsChange(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-timezone">
              Timezone
            </label>
            <Select id="settings-timezone" value={values.timeZone} onChange={(event) => onTimeZoneChange(event.target.value)}>
              {commonTimeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
              {isCustomTimeZone ? <option value={values.timeZone}>{values.timeZone}</option> : null}
            </Select>
          </div>

          <SaveButton type="submit" disabled={isPending} isLoading={isPending}>
            Save Preferences
          </SaveButton>
        </form>
        <p className="text-xs text-slate-500 mt-3">Timestamps are stored in UTC and displayed in your selected timezone.</p>
      </CardContent>
    </Card>
  );
}
