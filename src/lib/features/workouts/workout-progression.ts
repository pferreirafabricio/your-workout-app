import { z } from "zod";
import {
  MAX_REST_TARGET_SECONDS,
  MAX_RPE,
  MIN_REST_TARGET_SECONDS,
  MIN_RPE,
  PROGRESSION_METRICS,
  WEIGHT_UNITS,
} from "@/lib/types";

export const mutationErrorMessages = {
  validationError: "Please fix the highlighted fields and try again.",
  noActiveWorkout: "No active workout found.",
  movementArchived: "Archived movements cannot be logged in new sets.",
  missingBodyweightContext: "Record your bodyweight first to log this movement.",
  setNotFound: "Set not found for your active workout.",
  workoutNotFound: "Workout not found.",
  lockout: "Too many failed sign-in attempts. Please wait before trying again.",
  equipmentConflict: "Equipment code or name already exists.",
  equipmentNotFound: "Equipment not found.",
  persistenceError: "We could not save your changes. Please try again.",
} as const;

export const strongPasswordSchema = z
  .string()
  .min(8)
  .max(256)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,256}$/, {
    message:
      "Password must include uppercase, lowercase, number, and special character.",
  });

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())
  .or(z.string().min(1));

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const setUserPreferencesInputSchema = z.object({
  weightUnit: z.enum(WEIGHT_UNITS),
  defaultRestTargetSeconds: z.number().int().min(MIN_REST_TARGET_SECONDS).max(MAX_REST_TARGET_SECONDS).nullable(),
  timeZone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine((value) => isValidTimeZone(value), { message: "Invalid timezone." }),
});

export const recordBodyWeightInputSchema = z.object({
  weight: z.number().positive().max(1000),
  unit: z.enum(WEIGHT_UNITS),
  recordedAt: isoDate.optional(),
});

export const addSetInputSchema = z.object({
  movementId: z.string().min(1),
  reps: z.number().int().min(1).max(200),
  weight: z.number().min(0).max(2000).optional(),
  rpe: z.number().min(MIN_RPE).max(MAX_RPE).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  loggedAt: isoDate.optional(),
});

export const updateSetInputSchema = z.object({
  setId: z.string().min(1),
  reps: z.number().int().min(1).max(200).optional(),
  weight: z.number().min(0).max(2000).optional(),
  rpe: z.number().min(MIN_RPE).max(MAX_RPE).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  loggedAt: isoDate.optional(),
  expectedVersion: z.number().int().min(1).optional(),
});

export const deleteSetInputSchema = z.object({
  setId: z.string().min(1),
});

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

const equipmentCodeInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_\-\s]+$/)
  .transform((value) => value.toUpperCase().replaceAll(/[\s-]+/g, "_"));

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

export const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  clientSource: z.string().min(1).max(200).optional(),
});

export const progressionSeriesInputSchema = z.object({
  movementId: z.string().min(1),
  metric: z.enum(PROGRESSION_METRICS),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});

export const workoutHistoryInputSchema = z.object({
  movementId: z.string().optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});

export function parseOptionalDate(dateInput?: string): Date | undefined {
  if (!dateInput) {
    return undefined;
  }

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError("VALIDATION_ERROR");
  }
  return parsed;
}
