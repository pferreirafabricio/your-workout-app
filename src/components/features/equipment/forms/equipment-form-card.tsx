import { AddButton, CancelButton, SaveButton } from "@/components/ui/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type EquipmentFormValues = {
  code: string;
  name: string;
  displayOrder: string;
};

type EquipmentFormCardProps = {
  editing: boolean;
  values: EquipmentFormValues;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDisplayOrderChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
};

export function EquipmentFormCard({
  editing,
  values,
  onCodeChange,
  onNameChange,
  onDisplayOrderChange,
  onSubmit,
  onCancel,
  isCreatePending,
  isUpdatePending,
}: Readonly<EquipmentFormCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Edit Equipment" : "Add Equipment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSubmit();
          }}>
          <div>
            <label htmlFor="equipment-code" className="text-sm font-medium text-slate-700">
              Code
            </label>
            <Input
              id="equipment-code"
              placeholder="BARBELL"
              value={values.code}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="equipment-name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input
              id="equipment-name"
              placeholder="Barbell"
              value={values.name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="equipment-display-order" className="text-sm font-medium text-slate-700">
              Display Order
            </label>
            <Input
              id="equipment-display-order"
              type="number"
              min={0}
              max={9999}
              value={values.displayOrder}
              onChange={(event) => onDisplayOrderChange(event.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {editing ? (
              <SaveButton type="submit" isLoading={isUpdatePending} loadingText="Saving...">
                Save
              </SaveButton>
            ) : (
              <AddButton type="submit" isLoading={isCreatePending} loadingText="Creating...">
                Create
              </AddButton>
            )}
            {editing ? (
              <CancelButton type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </CancelButton>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
