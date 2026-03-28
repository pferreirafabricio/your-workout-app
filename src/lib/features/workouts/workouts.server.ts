import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware, csrfProtectionMiddleware } from "@/lib/features/auth/auth.server";
import { Prisma } from "../../../../prisma/generated/client/client";
import { DEFAULT_REST_TARGET_SECONDS, type ProgressionMetric, type WeightUnit } from "@/lib/types";
import { fromCanonicalKg, toCanonicalKg } from "@/lib/shared/utils";
import {
  addSetInputSchema,
  deleteSetInputSchema,
  mutationErrorMessages,
  parseOptionalDate,
  progressionSeriesInputSchema,
  recordBodyWeightInputSchema,
  setUserPreferencesInputSchema,
  updateSetInputSchema,
  workoutHistoryInputSchema,
} from "@/lib/features/workouts/workout-progression";

type ProjectedSet = {
  id: string;
  movementId: string;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
  weightSnapshotKg: number;
  bodyWeightSnapshot: number | null;
  loggedAt: Date;
  rpe: number | null;
  notes: string | null;
  version: number;
  movement: {
    id: string;
    name: string;
    type: "WEIGHTED" | "BODYWEIGHT";
    archivedAt: Date | null;
  };
  volumeKg: number;
};

export type WorkoutSummary = {
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
};

export function calculateSetVolume(weightKg: number, reps: number): number {
  return Math.round(weightKg * reps * 100) / 100;
}

export function calculateWorkoutSummary(
  startedAt: Date,
  completedAt: Date,
  sets: Array<{ weightSnapshotKg: number; reps: number }>,
): WorkoutSummary {
  return {
    durationSeconds: Math.max(0, Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)),
    totalVolumeKg:
      Math.round(sets.reduce((sum, set) => sum + calculateSetVolume(set.weightSnapshotKg, set.reps), 0) * 100) / 100,
    totalSets: sets.length,
  };
}

function toDbWeightUnit(unit: WeightUnit): "KG" | "LBS" {
  return unit === "kg" ? "KG" : "LBS";
}

function fromDbWeightUnit(unit: "KG" | "LBS"): WeightUnit {
  return unit === "KG" ? "kg" : "lbs";
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getOrCreateUserPreference(prisma: Awaited<ReturnType<typeof getServerSidePrismaClient>>, userId: string) {
  const existing = await prisma.userPreference.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }

  try {
    return await prisma.userPreference.create({
      data: {
        userId,
        weightUnit: "KG",
        defaultRestTargetSeconds: DEFAULT_REST_TARGET_SECONDS,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    return prisma.userPreference.findUniqueOrThrow({ where: { userId } });
  }
}

function projectSetForDisplay(
  set: {
    id: string;
    movementId: string;
    reps: number;
    weightSnapshotKg: number;
    bodyWeightSnapshot: number | null;
    loggedAt: Date;
    rpe: number | null;
    notes: string | null;
    version: number;
    movement: {
      id: string;
      name: string;
      type: "WEIGHTED" | "BODYWEIGHT";
      archivedAt: Date | null;
    };
  },
  preferredUnit: WeightUnit,
): ProjectedSet {
  return {
    id: set.id,
    movementId: set.movementId,
    reps: set.reps,
    weight: fromCanonicalKg(set.weightSnapshotKg, preferredUnit),
    weightUnit: preferredUnit,
    weightSnapshotKg: set.weightSnapshotKg,
    bodyWeightSnapshot: set.bodyWeightSnapshot,
    loggedAt: set.loggedAt,
    rpe: set.rpe,
    notes: set.notes,
    version: set.version,
    movement: set.movement,
    volumeKg: calculateSetVolume(set.weightSnapshotKg, set.reps),
  };
}

export const createWorkoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();

    const existing = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (existing) {
      return { success: true as const, workout: existing, reusedExisting: true as const };
    }

    const workout = await prisma.workout.create({
      data: {
        userId: context.user.id,
        startedAt: new Date(),
      },
    });

    return { success: true as const, workout, reusedExisting: false as const };
  });

export const updateWorkoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(120).nullable(),
    }),
  )
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const activeWorkout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (!activeWorkout) {
      return { success: false as const, error: mutationErrorMessages.noActiveWorkout };
    }

    const workout = await prisma.workout.update({
      where: { id: activeWorkout.id },
      data: { name: data.name },
    });

    return { success: true as const, workout };
  });

export const getCurrentWorkoutServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const preference = await getOrCreateUserPreference(prisma, context.user.id);
    const preferredUnit = fromDbWeightUnit(preference.weightUnit);

    const workout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      orderBy: { startedAt: "desc" },
      include: {
        sets: {
          include: { movement: true },
          orderBy: { loggedAt: "asc" },
        },
      },
    });

    if (!workout) {
      return null;
    }

    const projectedSets = workout.sets.map((set: any) => projectSetForDisplay(set, preferredUnit));
    const totalVolumeKg = projectedSets.reduce((sum: number, set: ProjectedSet) => sum + set.volumeKg, 0);
    const lastSet = workout.sets[workout.sets.length - 1] ?? null;

    return {
      id: workout.id,
      name: workout.name,
      startedAt: workout.startedAt,
      completedAt: workout.completedAt,
      preferredWeightUnit: preferredUnit,
      restTargetSeconds: preference.defaultRestTargetSeconds ?? DEFAULT_REST_TARGET_SECONDS,
      lastSetLoggedAt: lastSet?.loggedAt ?? null,
      sets: projectedSets,
      summary: {
        totalSets: projectedSets.length,
        totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
      },
    };
  });

export const completeWorkoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();

    const workout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      include: { sets: true },
      orderBy: { startedAt: "desc" },
    });

    if (!workout) {
      return { success: false as const, error: mutationErrorMessages.noActiveWorkout };
    }

    const completedAt = new Date();
    const updated = await prisma.workout.update({
      where: { id: workout.id },
      data: { completedAt },
      include: { sets: true },
    });

    const summary = calculateWorkoutSummary(updated.startedAt, completedAt, updated.sets);

    return {
      success: true as const,
      workout: updated,
      summary,
    };
  });

export const addSetServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(addSetInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const preference = await getOrCreateUserPreference(prisma, context.user.id);
    const preferredUnit = fromDbWeightUnit(preference.weightUnit);

    const workout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (!workout) {
      return { success: false as const, error: mutationErrorMessages.noActiveWorkout };
    }

    const movement = await prisma.movement.findFirst({
      where: { id: data.movementId, userId: context.user.id },
    });

    if (!movement || movement.archivedAt) {
      return { success: false as const, error: mutationErrorMessages.movementArchived };
    }

    const latestBodyWeight = await prisma.bodyWeightEntry.findFirst({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });

    let weightSnapshotKg = data.weight !== undefined ? toCanonicalKg(data.weight, preferredUnit) : 0;
    let bodyWeightSnapshot: number | null = null;

    if (movement.type === "BODYWEIGHT") {
      if (!latestBodyWeight) {
        return { success: false as const, error: mutationErrorMessages.missingBodyweightContext };
      }

      bodyWeightSnapshot = latestBodyWeight.weightKg;
      if (data.weight === undefined) {
        weightSnapshotKg = latestBodyWeight.weightKg;
      }
    }

    const set = await prisma.set.create({
      data: {
        workoutId: workout.id,
        movementId: movement.id,
        reps: data.reps,
        weightSnapshotKg,
        bodyWeightSnapshot,
        rpe: data.rpe ?? null,
        notes: data.notes ?? null,
        loggedAt: parseOptionalDate(data.loggedAt) ?? new Date(),
      },
      include: { movement: true },
    });

    return {
      success: true as const,
      set: projectSetForDisplay(set, preferredUnit),
    };
  });

export const updateSetServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(updateSetInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const preference = await getOrCreateUserPreference(prisma, context.user.id);
    const preferredUnit = fromDbWeightUnit(preference.weightUnit);

    const existingSet = await prisma.set.findFirst({
      where: {
        id: data.setId,
        workout: { userId: context.user.id, completedAt: null },
      },
      include: { movement: true },
    });

    if (!existingSet) {
      return { success: false as const, error: mutationErrorMessages.setNotFound };
    }

    const replacementNotice =
      data.expectedVersion !== undefined && data.expectedVersion !== existingSet.version
        ? {
            code: "SET_REPLACED",
            message: "Another edit was saved first. Latest values have replaced your copy.",
            previousVersion: data.expectedVersion,
            currentVersion: existingSet.version,
          }
        : null;

    let bodyWeightSnapshot = existingSet.bodyWeightSnapshot;
    if (existingSet.movement.type === "BODYWEIGHT" && data.weight === undefined && bodyWeightSnapshot === null) {
      const latestBodyWeight = await prisma.bodyWeightEntry.findFirst({
        where: { userId: context.user.id },
        orderBy: { recordedAt: "desc" },
      });
      bodyWeightSnapshot = latestBodyWeight?.weightKg ?? null;
    }

    const updated = await prisma.set.update({
      where: { id: existingSet.id },
      data: {
        reps: data.reps ?? existingSet.reps,
        weightSnapshotKg:
          data.weight !== undefined ? toCanonicalKg(data.weight, preferredUnit) : existingSet.weightSnapshotKg,
        bodyWeightSnapshot,
        rpe: data.rpe === undefined ? existingSet.rpe : data.rpe,
        notes: data.notes === undefined ? existingSet.notes : data.notes,
        loggedAt: parseOptionalDate(data.loggedAt) ?? existingSet.loggedAt,
        version: { increment: 1 },
      },
      include: { movement: true },
    });

    return {
      success: true as const,
      set: projectSetForDisplay(updated, preferredUnit),
      replacementNotice,
    };
  });

export const deleteSetServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(deleteSetInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    const set = await prisma.set.findFirst({
      where: {
        id: data.setId,
        workout: { userId: context.user.id, completedAt: null },
      },
    });

    if (!set) {
      return { success: false as const, error: mutationErrorMessages.setNotFound };
    }

    await prisma.set.delete({ where: { id: set.id } });

    return { success: true as const };
  });

export const setUserPreferencesServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(setUserPreferencesInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    const nextValues = {
      weightUnit: toDbWeightUnit(data.weightUnit),
      defaultRestTargetSeconds: data.defaultRestTargetSeconds,
    };

    let preference;
    try {
      preference = await prisma.userPreference.create({
        data: {
          userId: context.user.id,
          ...nextValues,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      preference = await prisma.userPreference.update({
        where: { userId: context.user.id },
        data: nextValues,
      });
    }

    return {
      success: true as const,
      preference: {
        ...preference,
        weightUnit: fromDbWeightUnit(preference.weightUnit),
      },
    };
  });

export const getUserPreferencesServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const preference = await getOrCreateUserPreference(prisma, context.user.id);
    return {
      ...preference,
      weightUnit: fromDbWeightUnit(preference.weightUnit),
    };
  });

export const recordBodyWeightServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(recordBodyWeightInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    const entry = await prisma.bodyWeightEntry.create({
      data: {
        userId: context.user.id,
        weightKg: toCanonicalKg(data.weight, data.unit),
        originalUnit: toDbWeightUnit(data.unit),
        recordedAt: parseOptionalDate(data.recordedAt) ?? new Date(),
      },
    });

    return { success: true as const, entry };
  });

export const getWorkoutHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(workoutHistoryInputSchema.optional())
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const preference = await getOrCreateUserPreference(prisma, context.user.id);
    const preferredUnit = fromDbWeightUnit(preference.weightUnit);

    const startDate = parseOptionalDate(data?.startDate);
    const endDate = parseOptionalDate(data?.endDate);

    const workouts = await prisma.workout.findMany({
      where: {
        userId: context.user.id,
        completedAt: { not: null, gte: startDate, lte: endDate },
        sets: data?.movementId ? { some: { movementId: data.movementId } } : undefined,
      },
      include: {
        sets: {
          include: { movement: true },
          orderBy: { loggedAt: "asc" },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    return workouts.map((workout: any) => {
      const projectedSets = workout.sets.map((set: any) => projectSetForDisplay(set, preferredUnit));
      return {
        ...workout,
        sets: projectedSets,
        summary: {
          totalSets: projectedSets.length,
          totalVolumeKg:
            Math.round(projectedSets.reduce((sum: number, set: ProjectedSet) => sum + set.volumeKg, 0) * 100) / 100,
        },
      };
    });
  });

export const deleteWorkoutsServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(z.object({ workoutIds: z.array(z.string()).min(1) }))
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    await prisma.set.deleteMany({
      where: {
        workout: {
          id: { in: data.workoutIds },
          userId: context.user.id,
        },
      },
    });

    await prisma.workout.deleteMany({
      where: {
        id: { in: data.workoutIds },
        userId: context.user.id,
      },
    });

    return { success: true as const };
  });

function normalizeDay(input: Date): string {
  const copy = new Date(input);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

export function buildProgressionSeries(
  rows: Array<{ loggedAt: Date; reps: number; weightSnapshotKg: number }>,
  metric: ProgressionMetric,
) {
  const grouped = new Map<string, Array<{ reps: number; weightSnapshotKg: number }>>();

  for (const row of rows) {
    const key = normalizeDay(row.loggedAt);
    const bucket = grouped.get(key) ?? [];
    bucket.push({ reps: row.reps, weightSnapshotKg: row.weightSnapshotKg });
    grouped.set(key, bucket);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, points]) => {
      if (metric === "maxWeight") {
        return { date, value: Math.max(...points.map((p) => p.weightSnapshotKg)) };
      }
      if (metric === "totalReps") {
        return { date, value: points.reduce((sum, point) => sum + point.reps, 0) };
      }
      return {
        date,
        value: Math.round(points.reduce((sum, point) => sum + point.reps * point.weightSnapshotKg, 0) * 100) / 100,
      };
    });
}

export const getProgressionSeriesServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(progressionSeriesInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const startDate = parseOptionalDate(data.startDate);
    const endDate = parseOptionalDate(data.endDate);

    const rows = await prisma.set.findMany({
      where: {
        movementId: data.movementId,
        movement: { userId: context.user.id },
        loggedAt: { gte: startDate, lte: endDate },
      },
      select: {
        loggedAt: true,
        reps: true,
        weightSnapshotKg: true,
      },
      orderBy: { loggedAt: "asc" },
    });

    return buildProgressionSeries(rows, data.metric);
  });

export const getBodyWeightSeriesServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(workoutHistoryInputSchema.pick({ startDate: true, endDate: true }).optional())
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const preference = await getOrCreateUserPreference(prisma, context.user.id);
    const preferredUnit = fromDbWeightUnit(preference.weightUnit);
    const startDate = parseOptionalDate(data?.startDate);
    const endDate = parseOptionalDate(data?.endDate);

    const entries = await prisma.bodyWeightEntry.findMany({
      where: {
        userId: context.user.id,
        recordedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { recordedAt: "asc" },
    });

    return entries.map((entry: any) => ({
      date: entry.recordedAt,
      weight: fromCanonicalKg(entry.weightKg, preferredUnit),
      weightUnit: preferredUnit,
      weightKg: entry.weightKg,
    }));
  });
