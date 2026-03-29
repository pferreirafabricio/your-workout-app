import { AddButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type MovementOption = {
  id: string;
  name: string;
};

type AddSetFormProps = {
  selectedMovement: string;
  movementOptions: MovementOption[];
  weight: string;
  reps: string;
  rpe: string;
  notes: string;
  weightPlaceholder: string;
  isSelectedMovementBodyweight: boolean;
  isPending: boolean;
  canSubmit: boolean;
  onMovementChange: (movementId: string) => void;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onRpeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
};

export function AddSetForm({
  selectedMovement,
  movementOptions,
  weight,
  reps,
  rpe,
  notes,
  weightPlaceholder,
  isSelectedMovementBodyweight,
  isPending,
  canSubmit,
  onMovementChange,
  onWeightChange,
  onRepsChange,
  onRpeChange,
  onNotesChange,
  onSubmit,
}: Readonly<AddSetFormProps>) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSubmit();
      }}
      className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
      <Select value={selectedMovement} onChange={(event) => onMovementChange(event.target.value)}>
        <option value="">Select movement</option>
        {movementOptions.map((movement) => (
          <option key={movement.id} value={movement.id}>
            {movement.name}
          </option>
        ))}
      </Select>

      <Input
        type="number"
        placeholder={weightPlaceholder}
        value={weight}
        onChange={(event) => onWeightChange(event.target.value)}
        className="w-full"
        min={0}
        disabled={isSelectedMovementBodyweight}
      />

      <Input type="number" placeholder="Reps" value={reps} onChange={(event) => onRepsChange(event.target.value)} className="w-full" min={1} />

      <Input
        type="number"
        placeholder="RPE (optional)"
        value={rpe}
        onChange={(event) => onRpeChange(event.target.value)}
        className="w-full"
        min={1}
        max={10}
        step={0.5}
      />

      <Input placeholder="Notes (optional)" value={notes} onChange={(event) => onNotesChange(event.target.value)} className="w-full" maxLength={500} />

      <AddButton type="submit" size="sm" disabled={!canSubmit} isLoading={isPending} />
    </form>
  );
}
