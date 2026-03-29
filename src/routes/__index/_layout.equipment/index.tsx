import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Archive, ArchiveRestore, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddButton, CancelButton, EditButton, SaveButton } from "@/components/ui/action-buttons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

type EquipmentRow = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
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

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Equipment" : "Add Equipment"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}>
            <form.Field name="code">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    Code
                  </label>
                  <Input
                    id={field.name}
                    placeholder="BARBELL"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="name">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <Input
                    id={field.name}
                    placeholder="Barbell"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="displayOrder">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    Display Order
                  </label>
                  <Input
                    id={field.name}
                    type="number"
                    min={0}
                    max={9999}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <div className="flex gap-2">
              {editingId ? (
                <SaveButton type="submit" isLoading={updateMutation.isPending} loadingText="Saving...">
                  Save
                </SaveButton>
              ) : (
                <AddButton type="submit" isLoading={createMutation.isPending} loadingText="Creating...">
                  Create
                </AddButton>
              )}
              {editingId ? (
                <CancelButton type="button" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </CancelButton>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

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
                    <EditButton type="button" size="sm" variant="ghost" onClick={() => beginEdit(row)} iconOnly={false}>
                      Edit
                    </EditButton>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setPendingToggleTarget(row)}>
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
