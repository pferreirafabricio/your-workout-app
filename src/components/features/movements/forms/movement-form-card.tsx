import { AddButton, CancelButton, SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type MuscleGroupValue =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "QUADS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES"
  | "CORE"
  | "FULL_BODY";

export type MovementFormValues = {
  name: string;
  type: "WEIGHTED" | "BODYWEIGHT";
  muscleGroup: MuscleGroupValue | "";
  equipmentId: string;
};

type EquipmentOption = {
  id: string;
  name: string;
};

type MovementFormCardProps = {
  editing: boolean;
  values: MovementFormValues;
  muscleGroupOptions: MuscleGroupValue[];
  equipmentOptions: EquipmentOption[];
  isCreatePending: boolean;
  isUpdatePending: boolean;
  onNameChange: (value: string) => void;
  onTypeChange: (value: "WEIGHTED" | "BODYWEIGHT") => void;
  onMuscleGroupChange: (value: MuscleGroupValue | "") => void;
  onEquipmentChange: (value: string) => void;
  onSubmit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
};

export function MovementFormCard({
  editing,
  values,
  muscleGroupOptions,
  equipmentOptions,
  isCreatePending,
  isUpdatePending,
  onNameChange,
  onTypeChange,
  onMuscleGroupChange,
  onEquipmentChange,
  onSubmit,
  onSaveEdit,
  onCancelEdit,
}: Readonly<MovementFormCardProps>) {
  const isNameEmpty = values.name.trim().length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Edit Movement" : "Add New Movement"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSubmit();
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input
            placeholder="Movement name (e.g. Bench Press)"
            value={values.name}
            onChange={(event) => onNameChange(event.target.value)}
            className="md:col-span-2"
          />

          <Select value={values.type} onChange={(event) => onTypeChange(event.target.value as "WEIGHTED" | "BODYWEIGHT")}>
            <option value="WEIGHTED">Weighted</option>
            <option value="BODYWEIGHT">Bodyweight</option>
          </Select>

          <Select value={values.muscleGroup} onChange={(event) => onMuscleGroupChange(event.target.value as MuscleGroupValue | "") }>
            <option value="">No muscle group</option>
            {muscleGroupOptions.map((group) => (
              <option key={group} value={group}>
                {group.replace("_", " ")}
              </option>
            ))}
          </Select>

          <Select value={values.equipmentId} onChange={(event) => onEquipmentChange(event.target.value)}>
            <option value="">No equipment</option>
            {equipmentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          {editing ? (
            <div className="flex items-center gap-2 md:col-span-5">
              <SaveButton
                type="button"
                onClick={onSaveEdit}
                disabled={isNameEmpty}
                isLoading={isUpdatePending}
                loadingText="Saving...">
                Save Changes
              </SaveButton>
              <CancelButton type="button" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </CancelButton>
            </div>
          ) : (
            <AddButton type="submit" disabled={isNameEmpty} isLoading={isCreatePending} />
          )}
        </form>
      </CardContent>
    </Card>
  );
}
