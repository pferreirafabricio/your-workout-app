import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { archiveMovementServerFn, createMovementServerFn, updateMovementServerFn } from "@/lib/features/movements/movements.server";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentQueryOptions, movementsQueryOptions } from "./-queries/movements";
import {
  archiveMovementInputSchema,
  createMovementInputSchema,
  updateMovementInputSchema,
} from "@/lib/features/movements/movements.validation";
import { Archive, ArchiveRestore, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { toast } from "sonner";
import {
  MovementFormCard,
  MovementsTable,
  type MovementFormValues,
  type MovementRow,
  type MuscleGroupValue,
} from "@/components/features/movements";

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

      <movementForm.Subscribe selector={(state) => state.values}>
        {(values) => (
          <MovementFormCard
            editing={editingId !== null}
            values={values as MovementFormValues}
            muscleGroupOptions={muscleGroupOptions as MuscleGroupValue[]}
            equipmentOptions={equipment as Array<{ id: string; name: string }>}
            isCreatePending={createMovementMutation.isPending}
            isUpdatePending={updateMovementMutation.isPending}
            onNameChange={(value) => movementForm.setFieldValue("name", value)}
            onTypeChange={(value) => movementForm.setFieldValue("type", value)}
            onMuscleGroupChange={(value) => movementForm.setFieldValue("muscleGroup", value)}
            onEquipmentChange={(value) => movementForm.setFieldValue("equipmentId", value)}
            onSubmit={() => movementForm.handleSubmit()}
            onSaveEdit={() => {
              if (editingId) {
                handleUpdate(editingId);
              }
            }}
            onCancelEdit={() => {
              setEditingId(null);
              movementForm.reset();
            }}
          />
        )}
      </movementForm.Subscribe>

      <MovementsTable
        movements={movements as MovementRow[]}
        onEdit={beginEdit}
        onToggleArchive={requestArchiveToggle}
      />

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
