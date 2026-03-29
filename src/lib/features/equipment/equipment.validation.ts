import { z } from "zod";

const equipmentCodeInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_\-\s]+$/)
  .transform((value) => value.toUpperCase().replaceAll(/[\s-]+/g, "_"));

export const equipmentMutationErrorMessages = {
  validationError: "Please fix the highlighted fields and try again.",
  equipmentConflict: "Equipment code or name already exists.",
  equipmentNotFound: "Equipment not found.",
  persistenceError: "We could not save your changes. Please try again.",
} as const;

export const createEquipmentInputSchema = z.object({
  code: equipmentCodeInputSchema,
  name: z.string().trim().min(1).max(120),
  displayOrder: z.number().int().min(0).max(9999),
});

export const updateEquipmentInputSchema = createEquipmentInputSchema.extend({
  equipmentId: z.string().min(1),
});

export const setEquipmentActiveStateInputSchema = z.object({
  equipmentId: z.string().min(1),
  isActive: z.boolean(),
});
