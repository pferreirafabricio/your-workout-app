import { z } from "zod";
import {
  MAX_REST_TARGET_SECONDS,
  MAX_RPE,
  MIN_REST_TARGET_SECONDS,
  MIN_RPE,
  PROGRESSION_METRICS,
  WEIGHT_UNITS,
} from "@/lib/shared/consts";

export const workoutMutationErrorMessages = {
  validationError: "Please fix the highlighted fields and try again.",
  noActiveWorkout: "No active workout found.",
  movementArchived: "Archived movements cannot be logged in new sets.",
  missingBodyweightContext: "Record your bodyweight first to log this movement.",
  setNotFound: "Set not found for your active workout.",
  workoutNotFound: "Workout not found.",
} as const;

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

const queueDirectionSchema = z.enum(["up", "down"]);

export const moveWorkoutQueueItemInputSchema = z.object({
  movementId: z.string().min(1),
  direction: queueDirectionSchema,
});

export const setWorkoutQueueItemSkippedInputSchema = z.object({
  movementId: z.string().min(1),
  skipped: z.boolean(),
});

export const activateWorkoutQueueMovementInputSchema = z.object({
  movementId: z.string().min(1),
});

export const setWorkoutQueueItemTargetSetsInputSchema = z.object({
  movementId: z.string().min(1),
  targetSets: z.number().int().min(1).max(12),
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

export function parseOptionalEndDateInclusive(dateInput?: string): Date | undefined {
  const parsed = parseOptionalDate(dateInput);
  if (!parsed) {
    return undefined;
  }

  if (!dateInput || !/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return parsed;
  }

  parsed.setUTCHours(23, 59, 59, 999);
  return parsed;
}
