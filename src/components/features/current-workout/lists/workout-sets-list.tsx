import { DeleteButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { formatWeight } from "@/lib/shared/utils";

type WorkoutSet = {
  id: string;
  reps: number;
  weight: number;
  weightUnit: "kg" | "lbs";
  rpe: number | null;
  notes: string | null;
  version: number;
  movement: { name: string };
};

type WorkoutSetsListProps = {
  sets: WorkoutSet[];
  editingSetId: string | null;
  reps: string;
  weight: string;
  rpe: string;
  notes: string;
  isUpdatePending: boolean;
  onOpenEditor: (set: WorkoutSet) => void;
  onRequestDelete: (setId: string) => void;
  onRepsChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onRpeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onInlineSave: (setId: string, version: number) => void;
};

export function WorkoutSetsList({
  sets,
  editingSetId,
  reps,
  weight,
  rpe,
  notes,
  isUpdatePending,
  onOpenEditor,
  onRequestDelete,
  onRepsChange,
  onWeightChange,
  onRpeChange,
  onNotesChange,
  onInlineSave,
}: Readonly<WorkoutSetsListProps>) {
  if (sets.length === 0) {
    return <p className="text-sm text-slate-500">No sets yet. Add exercises to your workout!</p>;
  }

  return (
    <ul className="space-y-2">
      {sets.map((set) => (
        <li key={set.id} className="px-3 py-2 bg-slate-50 rounded-lg text-sm flex items-center justify-between">
          <div>
            <span className="font-medium">{set.movement.name}</span>
            <span className="text-slate-500 ml-2">
              {set.reps} reps x {formatWeight(set.weight, set.weightUnit)}
            </span>
            {set.rpe === null ? null : <span className="text-slate-500 ml-2">RPE {set.rpe}</span>}
            {set.notes ? <p className="text-xs text-slate-500 mt-1">{set.notes}</p> : null}
            {editingSetId === set.id ? (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input type="number" value={reps} min={1} onChange={(event) => onRepsChange(event.target.value)} />
                <Input type="number" value={weight} min={0} onChange={(event) => onWeightChange(event.target.value)} />
                <Input type="number" value={rpe} min={1} max={10} step={0.5} onChange={(event) => onRpeChange(event.target.value)} />
                <Input value={notes} onChange={(event) => onNotesChange(event.target.value)} maxLength={500} />
                <SaveButton
                  size="sm"
                  onClick={() => onInlineSave(set.id, set.version)}
                  disabled={isUpdatePending}
                  isLoading={isUpdatePending}
                  loadingText="loading...">
                  Save
                </SaveButton>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <EditButton onClick={() => onOpenEditor(set)} className="h-8 w-8 text-slate-400" iconOnly />
            <DeleteButton
              variant="ghost"
              size="icon"
              iconOnly
              onClick={() => onRequestDelete(set.id)}
              className="h-8 w-8 text-slate-400"
              aria-label="Delete set">
              Delete set
            </DeleteButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
