import { Archive, ArchiveRestore } from "lucide-react";
import { EditButton } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type EquipmentRow = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
};

type EquipmentTableProps = {
  equipment: EquipmentRow[];
  onEdit: (row: EquipmentRow) => void;
  onToggleActive: (row: EquipmentRow) => void;
};

export function EquipmentTable({ equipment, onEdit, onToggleActive }: Readonly<EquipmentTableProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Catalog</CardTitle>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <p className="text-sm text-slate-500">No equipment entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {equipment.map((row) => (
              <li key={row.id} className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {row.name}
                    {row.isActive ? null : <span className="ml-2 text-xs text-amber-700">Archived</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    code: {row.code} | order: {row.displayOrder}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <EditButton type="button" size="sm" variant="ghost" onClick={() => onEdit(row)} iconOnly={false}>
                    Edit
                  </EditButton>
                  <Button type="button" size="sm" variant="ghost" onClick={() => onToggleActive(row)}>
                    {row.isActive ? (
                      <>
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </>
                    ) : (
                      <>
                        <ArchiveRestore className="h-4 w-4 mr-1" />
                        Restore
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
