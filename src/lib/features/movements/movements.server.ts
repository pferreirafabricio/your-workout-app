import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/core/db.server";
import { authMiddleware, csrfProtectionMiddleware } from "@/lib/features/auth/auth.server";
import {
  archiveMovementInputSchema,
  createMovementInputSchema,
  mutationErrorMessages,
  updateMovementInputSchema,
} from "@/lib/features/workouts/workout-progression";

export const createMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(createMovementInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    if (data.equipmentId) {
      const equipment = await prisma.equipment.findUnique({ where: { id: data.equipmentId } });
      if (!equipment || !equipment.isActive) {
        return { success: false as const, error: "INVALID_EQUIPMENT" };
      }
    }

    const movement = await prisma.movement.create({
      data: {
        userId: context.user.id,
        name: data.name,
        type: data.type,
        muscleGroup: data.muscleGroup ?? null,
        equipmentId: data.equipmentId ?? null,
      },
    });

    return { success: true as const, movement };
  });

export const updateMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(updateMovementInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    if (data.equipmentId) {
      const equipment = await prisma.equipment.findUnique({ where: { id: data.equipmentId } });
      if (!equipment || !equipment.isActive) {
        return { success: false as const, error: "INVALID_EQUIPMENT" };
      }
    }

    const movement = await prisma.movement.findFirst({
      where: { id: data.movementId, userId: context.user.id },
    });

    if (!movement) {
      return { success: false as const, error: "NOT_FOUND" };
    }

    const updatedMovement = await prisma.movement.update({
      where: { id: movement.id },
      data: {
        name: data.name,
        type: data.type,
        muscleGroup: data.muscleGroup ?? null,
        equipmentId: data.equipmentId ?? null,
      },
    });

    return { success: true as const, movement: updatedMovement };
  });

export const archiveMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(archiveMovementInputSchema)
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();

    const movement = await prisma.movement.findFirst({
      where: { id: data.movementId, userId: context.user.id },
    });

    if (!movement) {
      return { success: false as const, error: "NOT_FOUND" };
    }

    const activeWorkout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      select: { id: true },
    });

    if (data.archive && activeWorkout) {
      const setCount = await prisma.set.count({
        where: {
          workoutId: activeWorkout.id,
          movementId: movement.id,
        },
      });

      if (setCount > 0) {
        return {
          success: false as const,
          error: mutationErrorMessages.validationError,
          message: "Cannot archive a movement currently used in your active workout.",
        };
      }
    }

    const updatedMovement = await prisma.movement.update({
      where: { id: movement.id },
      data: {
        archivedAt: data.archive ? new Date() : null,
      },
    });

    return { success: true as const, movement: updatedMovement };
  });

export const getMovementsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
  const prisma = await getServerSidePrismaClient();
  return prisma.movement.findMany({
    where: { userId: context.user.id },
    orderBy: { name: "asc" },
    include: {
      equipment: true,
    },
  });
});

export const getEquipmentCatalogServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const prisma = await getServerSidePrismaClient();
    return prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  });
