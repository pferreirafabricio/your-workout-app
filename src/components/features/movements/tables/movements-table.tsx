import { Archive, ArchiveRestore } from "lucide-react";
import { EditButton } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type MovementRow = {
  id: string;
  name: string;
  type: "WEIGHTED" | "BODYWEIGHT";
  muscleGroup: string | null;
  equipmentId: string | null;
  archivedAt: Date | null;
  equipment?: { name: string } | null;
};

type MovementsTableProps = {
  movements: MovementRow[];
  onEdit: (movement: MovementRow) => void;
  onToggleArchive: (movementId: string, currentlyArchived: boolean) => void;
};

export function MovementsTable({ movements, onEdit, onToggleArchive }: Readonly<MovementsTableProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Movements</CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <p className="text-sm text-slate-500">No movements yet. Add one above!</p>
        ) : (
          <ul className="space-y-2">
            {movements.map((movement) => (
              <li
                key={movement.id}
                className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {movement.name}
                    {movement.archivedAt ? <span className="ml-2 text-xs text-amber-700">Archived</span> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {movement.type.toLowerCase()} | {movement.muscleGroup?.replace("_", " ") || "no muscle group"} |{" "}
                    {movement.equipment?.name || "no equipment"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <EditButton variant="ghost" size="sm" onClick={() => onEdit(movement)} iconOnly={false}>
                    Edit
                  </EditButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleArchive(movement.id, Boolean(movement.archivedAt))}>
                    {movement.archivedAt ? (
                      <>
                        <ArchiveRestore className="h-4 w-4 mr-1" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
