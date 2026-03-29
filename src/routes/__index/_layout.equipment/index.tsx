import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Archive, ArchiveRestore, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  EquipmentFormCard,
  EquipmentTable,
  type EquipmentRow,
} from "@/components/features/equipment";
import {
  createEquipmentServerFn,
  setEquipmentActiveStateServerFn,
  updateEquipmentServerFn,
} from "@/lib/features/equipment/equipment.server";
import {
  createEquipmentInputSchema,
  equipmentMutationErrorMessages,
  setEquipmentActiveStateInputSchema,
  updateEquipmentInputSchema,
} from "@/lib/features/equipment/equipment.validation";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { equipmentManagementQueryOptions } from "./-queries/equipment";
import { toast } from "sonner";

type EquipmentFormValues = {
  code: string;
  name: string;
  displayOrder: string;
};

const EMPTY_FORM: EquipmentFormValues = {
  code: "",
  name: "",
  displayOrder: "0",
};

function normalizeEquipmentForm(values: EquipmentFormValues) {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    displayOrder: Number(values.displayOrder),
  };
}

export const Route = createFileRoute("/__index/_layout/equipment/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(equipmentManagementQueryOptions());
  },
  component: EquipmentPage,
});

function EquipmentPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(equipmentManagementQueryOptions());

  const equipment = useMemo(
    () =>
      [...(data as EquipmentRow[])].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name);
      }),
    [data],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [pendingToggleTarget, setPendingToggleTarget] = useState<EquipmentRow | null>(null);

  const form = useForm({
    defaultValues: EMPTY_FORM,
    onSubmit: ({ value }) => {
      if (editingId) {
        const parsed = updateEquipmentInputSchema.safeParse({
          equipmentId: editingId,
          ...normalizeEquipmentForm(value),
        });

        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? equipmentMutationErrorMessages.validationError;
          setError(message);
          toast.error(message);
          return;
        }

        updateMutation.mutate(parsed.data);
        return;
      }

      const parsed = createEquipmentInputSchema.safeParse(normalizeEquipmentForm(value));
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? equipmentMutationErrorMessages.validationError;
        setError(message);
        toast.error(message);
        return;
      }

      createMutation.mutate(parsed.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; displayOrder: number }) =>
      createEquipmentServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? equipmentMutationErrorMessages.persistenceError;
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      form.reset();
      queryClient.invalidateQueries({ queryKey: equipmentManagementQueryOptions().queryKey });
      toast.success("Equipment created.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; code: string; name: string; displayOrder: number }) =>
      updateEquipmentServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? equipmentMutationErrorMessages.persistenceError;
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: equipmentManagementQueryOptions().queryKey });
      toast.success("Equipment updated.");
    },
  });

  const activeStateMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; isActive: boolean }) =>
      setEquipmentActiveStateServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? equipmentMutationErrorMessages.persistenceError;
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      setPendingToggleTarget(null);
      queryClient.invalidateQueries({ queryKey: equipmentManagementQueryOptions().queryKey });
      toast.success("Equipment status updated.");
    },
  });

  const beginEdit = (row: EquipmentRow) => {
    setEditingId(row.id);
    form.setFieldValue("code", row.code);
    form.setFieldValue("name", row.name);
    form.setFieldValue("displayOrder", String(row.displayOrder));
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
    setError("");
  };

  const confirmToggle = () => {
    if (!pendingToggleTarget) {
      return;
    }

    const parsed = setEquipmentActiveStateInputSchema.safeParse({
      equipmentId: pendingToggleTarget.id,
      isActive: !pendingToggleTarget.isActive,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? equipmentMutationErrorMessages.validationError;
      setError(message);
      toast.error(message);
      setPendingToggleTarget(null);
      return;
    }

    activeStateMutation.mutate(parsed.data);
  };


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Equipment</h1>

      {error ? (
        <Card>
          <CardContent className="py-3 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <EquipmentFormCard
            editing={editingId !== null}
            values={values}
            onCodeChange={(value) => form.setFieldValue("code", value)}
            onNameChange={(value) => form.setFieldValue("name", value)}
            onDisplayOrderChange={(value) => form.setFieldValue("displayOrder", value)}
            onSubmit={() => form.handleSubmit()}
            onCancel={cancelEdit}
            isCreatePending={createMutation.isPending}
            isUpdatePending={updateMutation.isPending}
          />
        )}
      </form.Subscribe>

      <EquipmentTable equipment={equipment} onEdit={beginEdit} onToggleActive={setPendingToggleTarget} />

      <ConfirmDialog
        open={pendingToggleTarget !== null}
        title={pendingToggleTarget?.isActive ? "Archive equipment?" : "Restore equipment?"}
        description={
          pendingToggleTarget?.isActive
            ? "Archived equipment will be hidden from active movement equipment pickers."
            : "Restored equipment will be available again for movement selection."
        }
        confirmLabel={pendingToggleTarget?.isActive ? "Archive" : "Restore"}
        cancelLabel="Cancel"
        confirmIcon={pendingToggleTarget?.isActive ? Archive : ArchiveRestore}
        cancelIcon={X}
        isPending={activeStateMutation.isPending}
        onConfirm={confirmToggle}
        onCancel={() => {
          if (!activeStateMutation.isPending) {
            setPendingToggleTarget(null);
          }
        }}
      />
    </div>
  );
}
