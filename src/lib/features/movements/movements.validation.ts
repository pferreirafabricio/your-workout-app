import { z } from "zod";

export const movementMutationErrorMessages = {
  validationError: "Please fix the highlighted fields and try again.",
  persistenceError: "We could not save your changes. Please try again.",
} as const;

export const createMovementInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["WEIGHTED", "BODYWEIGHT"]),
  muscleGroup: z
    .enum([
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
    ])
    .optional()
    .nullable(),
  equipmentId: z.string().optional().nullable(),
});

export const updateMovementInputSchema = createMovementInputSchema.extend({
  movementId: z.string().min(1),
});

export const archiveMovementInputSchema = z.object({
  movementId: z.string().min(1),
  archive: z.boolean().default(true),
});
