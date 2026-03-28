import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Plus, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createEquipmentServerFn,
  setEquipmentActiveStateServerFn,
  updateEquipmentServerFn,
} from "@/lib/features/equipment/equipment.server";
import {
  createEquipmentInputSchema,
  mutationErrorMessages,
  setEquipmentActiveStateInputSchema,
  updateEquipmentInputSchema,
} from "@/lib/features/workouts/workout-progression";
import { getCsrfHeaders } from "@/lib/csrf.client";
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

  const [form, setForm] = useState<EquipmentFormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [pendingToggleTarget, setPendingToggleTarget] = useState<EquipmentRow | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; displayOrder: number }) =>
      createEquipmentServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? mutationErrorMessages.persistenceError;
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: equipmentManagementQueryOptions().queryKey });
      toast.success("Equipment created.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; code: string; name: string; displayOrder: number }) =>
      updateEquipmentServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? mutationErrorMessages.persistenceError;
        setError(message);
        toast.error(message);
        return;
      }

      setError("");
      setEditingId(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: equipmentManagementQueryOptions().queryKey });
      toast.success("Equipment updated.");
    },
  });

  const activeStateMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; isActive: boolean }) =>
      setEquipmentActiveStateServerFn({ data: payload, headers: getCsrfHeaders() }),
    onSuccess: (response) => {
      if (!response.success) {
        const message = response.message ?? mutationErrorMessages.persistenceError;
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

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (editingId) {
      const parsed = updateEquipmentInputSchema.safeParse({
        equipmentId: editingId,
        ...normalizeEquipmentForm(form),
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? mutationErrorMessages.validationError;
        setError(message);
        toast.error(message);
        return;
      }

      updateMutation.mutate(parsed.data);
      return;
    }

    const parsed = createEquipmentInputSchema.safeParse(normalizeEquipmentForm(form));
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? mutationErrorMessages.validationError;
      setError(message);
      toast.error(message);
      return;
    }

    createMutation.mutate(parsed.data);
  };

  const beginEdit = (row: EquipmentRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      displayOrder: String(row.displayOrder),
    });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
      const message = parsed.error.issues[0]?.message ?? mutationErrorMessages.validationError;
      setError(message);
      toast.error(message);
      setPendingToggleTarget(null);
      return;
    }

    activeStateMutation.mutate(parsed.data);
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

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
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end" onSubmit={onSubmit}>
            <div>
              <label htmlFor="equipment-code" className="text-sm font-medium text-slate-700">
                Code
              </label>
              <Input
                id="equipment-code"
                placeholder="BARBELL"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="equipment-name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <Input
                id="equipment-name"
                placeholder="Barbell"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
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
                value={form.displayOrder}
                onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isBusy} className="gap-2">
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Save" : "Create"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={cancelEdit} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
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
                    <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(row)}>
                      Edit
                    </Button>
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
