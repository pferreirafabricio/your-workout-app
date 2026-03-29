import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { AddButton, CancelButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { archiveMovementServerFn, createMovementServerFn, updateMovementServerFn } from "@/lib/features/movements/movements.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentQueryOptions, movementsQueryOptions } from "./-queries/movements";
import { Select } from "@/components/ui/select";
import { archiveMovementInputSchema, createMovementInputSchema, updateMovementInputSchema } from "@/lib/features/workouts/workout-progression";
import { Archive, ArchiveRestore, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingArchiveTarget, setPendingArchiveTarget] = useState<{ id: string; currentlyArchived: boolean } | null>(null);
  const [error, setError] = useState("");

  const movementForm = useForm({
    defaultValues: {
      name: "",
      type: "WEIGHTED" as "WEIGHTED" | "BODYWEIGHT",
      muscleGroup: "" as MuscleGroupValue | "",
      equipmentId: "",
    },
    onSubmit: ({ value }) => {
      const parsed = createMovementInputSchema.safeParse({
        name: value.name.trim(),
        type: value.type,
        muscleGroup: value.muscleGroup || null,
        equipmentId: value.equipmentId || null,
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
    },
  });

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
      movementForm.reset();
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

  const handleUpdate = (movementId: string) => {
    const value = movementForm.state.values;
    const parsed = updateMovementInputSchema.safeParse({
      movementId,
      name: value.name.trim(),
      type: value.type,
      muscleGroup: value.muscleGroup || null,
      equipmentId: value.equipmentId || null,
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
    movementForm.setFieldValue("name", movement.name);
    movementForm.setFieldValue("type", movement.type);
    movementForm.setFieldValue("muscleGroup", (movement.muscleGroup as MuscleGroupValue | null) ?? "");
    movementForm.setFieldValue("equipmentId", movement.equipmentId ?? "");
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              movementForm.handleSubmit();
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <movementForm.Field name="name">
              {(field) => (
                <Input
                  placeholder="Movement name (e.g. Bench Press)"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="md:col-span-2"
                />
              )}
            </movementForm.Field>
            <movementForm.Field name="type">
              {(field) => (
                <Select value={field.state.value} onChange={(event) => field.handleChange(event.target.value as "WEIGHTED" | "BODYWEIGHT")}> 
                  <option value="WEIGHTED">Weighted</option>
                  <option value="BODYWEIGHT">Bodyweight</option>
                </Select>
              )}
            </movementForm.Field>
            <movementForm.Field name="muscleGroup">
              {(field) => (
                <Select value={field.state.value} onChange={(event) => field.handleChange(event.target.value as MuscleGroupValue | "") }>
                  <option value="">No muscle group</option>
                  {muscleGroupOptions.map((group) => (
                    <option key={group} value={group}>
                      {group.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              )}
            </movementForm.Field>
            <movementForm.Field name="equipmentId">
              {(field) => (
                <Select value={field.state.value} onChange={(event) => field.handleChange(event.target.value)}>
                  <option value="">No equipment</option>
                  {equipment.map((item: { id: string; name: string }) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              )}
            </movementForm.Field>
            {editingId ? (
              <div className="flex items-center gap-2 md:col-span-5">
                <movementForm.Subscribe selector={(state) => state.values.name}>
                  {(name) => (
                    <SaveButton
                      type="button"
                      onClick={() => handleUpdate(editingId)}
                      disabled={!name.trim()}
                      isLoading={updateMovementMutation.isPending}
                      loadingText="Saving...">
                      Save Changes
                    </SaveButton>
                  )}
                </movementForm.Subscribe>
                <CancelButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    movementForm.reset();
                  }}>
                  Cancel
                </CancelButton>
              </div>
            ) : (
              <movementForm.Subscribe selector={(state) => state.values.name}>
                {(name) => (
                  <AddButton type="submit" disabled={!name.trim()} isLoading={createMovementMutation.isPending} />
                )}
              </movementForm.Subscribe>
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
