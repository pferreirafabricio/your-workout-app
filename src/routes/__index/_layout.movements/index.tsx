import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AddButton, CancelButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { archiveMovementServerFn, createMovementServerFn, updateMovementServerFn } from "@/lib/movements.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentQueryOptions, movementsQueryOptions } from "./-queries/movements";
import { Select } from "@/components/ui/select";
import { archiveMovementInputSchema, createMovementInputSchema, updateMovementInputSchema } from "@/lib/validation/workout-progression";
import { Archive, ArchiveRestore, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/csrf.client";
import { toast } from "sonner";

type MuscleGroupValue =
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

export const Route = createFileRoute("/__index/_layout/movements/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(movementsQueryOptions()),
      context.queryClient.ensureQueryData(equipmentQueryOptions()),
    ]);
  },
  component: MovementsPage,
});

function MovementsPage() {
  const queryClient = useQueryClient();
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const { data: equipment } = useSuspenseQuery(equipmentQueryOptions());
  const [name, setName] = useState("");
  const [type, setType] = useState<"WEIGHTED" | "BODYWEIGHT">("WEIGHTED");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroupValue | "">("");
  const [equipmentId, setEquipmentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingArchiveTarget, setPendingArchiveTarget] = useState<{ id: string; currentlyArchived: boolean } | null>(null);
  const [error, setError] = useState("");

  const createMovementMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      type: "WEIGHTED" | "BODYWEIGHT";
      muscleGroup?: MuscleGroupValue | null;
      equipmentId: string | null;
    }) => createMovementServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.error ?? "Could not create movement.";
        setError(message);
        toast.error(message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setName("");
      setMuscleGroup("");
      setEquipmentId("");
      setError("");
      toast.success("Movement created.");
    },
  });

  const updateMovementMutation = useMutation({
    mutationFn: (payload: {
      movementId: string;
      name: string;
      type: "WEIGHTED" | "BODYWEIGHT";
      muscleGroup?: MuscleGroupValue | null;
      equipmentId: string | null;
    }) => updateMovementServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.error ?? "Could not update movement.";
        setError(message);
        toast.error(message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setEditingId(null);
      setError("");
      toast.success("Movement updated.");
    },
  });

  const archiveMovementMutation = useMutation({
    mutationFn: (payload: { movementId: string; archive: boolean }) =>
      archiveMovementServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? response.error ?? "Could not change archive state.";
        setError(message);
        toast.error(message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setError("");
      toast.success("Movement status updated.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = createMovementInputSchema.safeParse({
      name: name.trim(),
      type,
      muscleGroup: muscleGroup || null,
      equipmentId: equipmentId || null,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid movement fields.";
      setError(message);
      toast.error(message);
      return;
    }

    createMovementMutation.mutate({
      ...parsed.data,
      muscleGroup: parsed.data.muscleGroup ?? null,
      equipmentId: parsed.data.equipmentId ?? null,
    });
  };

  const handleUpdate = (movementId: string) => {
    const parsed = updateMovementInputSchema.safeParse({
      movementId,
      name: name.trim(),
      type,
      muscleGroup: muscleGroup || null,
      equipmentId: equipmentId || null,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid movement fields.";
      setError(message);
      toast.error(message);
      return;
    }

    updateMovementMutation.mutate({
      ...parsed.data,
      muscleGroup: parsed.data.muscleGroup ?? null,
      equipmentId: parsed.data.equipmentId ?? null,
    });
  };

  const requestArchiveToggle = (movementId: string, currentlyArchived: boolean) => {
    setPendingArchiveTarget({ id: movementId, currentlyArchived });
  };

  const confirmArchiveToggle = () => {
    if (!pendingArchiveTarget) return;

    const parsed = archiveMovementInputSchema.safeParse({
      movementId: pendingArchiveTarget.id,
      archive: !pendingArchiveTarget.currentlyArchived,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid archive request.";
      setError(message);
      toast.error(message);
      setPendingArchiveTarget(null);
      return;
    }

    archiveMovementMutation.mutate(parsed.data, {
      onSuccess: () => {
        setPendingArchiveTarget(null);
      },
      onError: () => {
        setPendingArchiveTarget(null);
      },
    });
  };

  const beginEdit = (movement: {
    id: string;
    name: string;
    type: "WEIGHTED" | "BODYWEIGHT";
    muscleGroup: string | null;
    equipmentId: string | null;
  }) => {
    setEditingId(movement.id);
    setName(movement.name);
    setType(movement.type);
    setMuscleGroup((movement.muscleGroup as MuscleGroupValue | null) ?? "");
    setEquipmentId(movement.equipmentId ?? "");
    setError("");
  };

  const muscleGroupOptions = [
    "CHEST",
    "BACK",
    "SHOULDERS",
    "BICEPS",
    "TRICEPS",
    "QUADS",
    "HAMSTRINGS",
    "GLUTES",
    "CALVES",
    "CORE",
    "FULL_BODY",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Movements</h1>

      {error && (
        <Card>
          <CardContent className="py-3 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Movement" : "Add New Movement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              placeholder="Movement name (e.g. Bench Press)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="md:col-span-2"
            />
            <Select value={type} onChange={(event) => setType(event.target.value as "WEIGHTED" | "BODYWEIGHT")}> 
              <option value="WEIGHTED">Weighted</option>
              <option value="BODYWEIGHT">Bodyweight</option>
            </Select>
            <Select value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value as MuscleGroupValue | "") }>
              <option value="">No muscle group</option>
              {muscleGroupOptions.map((group) => (
                <option key={group} value={group}>
                  {group.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Select value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)}>
              <option value="">No equipment</option>
              {equipment.map((item: { id: string; name: string }) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            {!editingId ? (
              <AddButton type="submit" disabled={!name.trim()} isLoading={createMovementMutation.isPending} />
            ) : (
              <div className="flex items-center gap-2 md:col-span-5">
                <SaveButton
                  type="button"
                  onClick={() => handleUpdate(editingId)}
                  disabled={!name.trim()}
                  isLoading={updateMovementMutation.isPending}
                  loadingText="Saving...">
                  Save Changes
                </SaveButton>
                <CancelButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setType("WEIGHTED");
                    setMuscleGroup("");
                    setEquipmentId("");
                  }}>
                  Cancel
                </CancelButton>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">No movements yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {movements.map((movement: {
                id: string;
                name: string;
                type: "WEIGHTED" | "BODYWEIGHT";
                muscleGroup: string | null;
                equipmentId: string | null;
                archivedAt: Date | null;
                equipment?: { name: string } | null;
              }) => (
                <li key={movement.id} className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {movement.name}
                      {movement.archivedAt && <span className="ml-2 text-xs text-amber-700">Archived</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {movement.type.toLowerCase()} | {movement.muscleGroup?.replace("_", " ") || "no muscle group"} |{" "}
                      {movement.equipment?.name || "no equipment"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditButton variant="ghost" size="sm" onClick={() => beginEdit(movement)} iconOnly={false}>
                      Edit
                    </EditButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestArchiveToggle(movement.id, Boolean(movement.archivedAt))}>
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

      <ConfirmDialog
        open={pendingArchiveTarget != null}
        title={pendingArchiveTarget?.currentlyArchived ? "Restore movement?" : "Archive movement?"}
        description={
          pendingArchiveTarget?.currentlyArchived
            ? "This makes the movement available again when logging new workouts."
            : "This hides the movement from new workout logging while keeping history intact."
        }
        confirmLabel={pendingArchiveTarget?.currentlyArchived ? "Restore" : "Archive"}
        cancelLabel="Cancel"
        cancelIcon={X}
        confirmIcon={pendingArchiveTarget?.currentlyArchived ? ArchiveRestore : Archive}
        isPending={archiveMovementMutation.isPending}
        onConfirm={confirmArchiveToggle}
        onCancel={() => {
          if (!archiveMovementMutation.isPending) {
            setPendingArchiveTarget(null);
          }
        }}
      />
    </div>
  );
}
