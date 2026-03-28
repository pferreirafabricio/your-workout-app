import { createServerFn } from "@tanstack/react-start";
import { Prisma } from "../../../../prisma/generated/client/client";
import { authMiddleware, csrfProtectionMiddleware } from "@/lib/features/auth/auth.server";
import { getServerSidePrismaClient } from "@/lib/db.server";
import {
  createEquipmentInputSchema,
  mutationErrorMessages,
  setEquipmentActiveStateInputSchema,
  updateEquipmentInputSchema,
} from "@/lib/features/workouts/workout-progression";

type EquipmentMutationErrorCode = "CONFLICT" | "NOT_FOUND" | "PERSISTENCE_ERROR";

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function mapEquipmentMutationError(error: unknown): EquipmentMutationErrorCode {
  if (isKnownPrismaError(error) && error.code === "P2002") {
    return "CONFLICT";
  }

  if (isKnownPrismaError(error) && error.code === "P2025") {
    return "NOT_FOUND";
  }

  return "PERSISTENCE_ERROR";
}

function getEquipmentMutationErrorMessage(code: EquipmentMutationErrorCode): string {
  if (code === "CONFLICT") {
    return mutationErrorMessages.equipmentConflict;
  }

  if (code === "NOT_FOUND") {
    return mutationErrorMessages.equipmentNotFound;
  }

  return mutationErrorMessages.persistenceError;
}

function logEquipmentMutationError(operation: string, error: unknown, context: Record<string, string>) {
  const code = isKnownPrismaError(error) ? error.code : "UNKNOWN";
  const safeContext = JSON.stringify(context);
  console.error(`[equipment:${operation}] mutation failed`, { code, context: safeContext });
}

export const getEquipmentListServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const prisma = await getServerSidePrismaClient();
    return prisma.equipment.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  });

export const createEquipmentServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(createEquipmentInputSchema)
  .handler(async ({ data }) => {
    const prisma = await getServerSidePrismaClient();

    try {
      const equipment = await prisma.equipment.create({
        data: {
          code: data.code,
          name: data.name,
          displayOrder: data.displayOrder,
          isActive: true,
        },
      });

      return { success: true as const, equipment };
    } catch (error) {
      const code = mapEquipmentMutationError(error);
      logEquipmentMutationError("create", error, { code: data.code, name: data.name });
      return {
        success: false as const,
        error: code,
        message: getEquipmentMutationErrorMessage(code),
      };
    }
  });

export const updateEquipmentServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(updateEquipmentInputSchema)
  .handler(async ({ data }) => {
    const prisma = await getServerSidePrismaClient();

    const existing = await prisma.equipment.findUnique({ where: { id: data.equipmentId } });
    if (!existing) {
      return {
        success: false as const,
        error: "NOT_FOUND" as const,
        message: mutationErrorMessages.equipmentNotFound,
      };
    }

    try {
      const equipment = await prisma.equipment.update({
        where: { id: data.equipmentId },
        data: {
          code: data.code,
          name: data.name,
          displayOrder: data.displayOrder,
        },
      });

      return { success: true as const, equipment };
    } catch (error) {
      const code = mapEquipmentMutationError(error);
      logEquipmentMutationError("update", error, { equipmentId: data.equipmentId });
      return {
        success: false as const,
        error: code,
        message: getEquipmentMutationErrorMessage(code),
      };
    }
  });

export const setEquipmentActiveStateServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(setEquipmentActiveStateInputSchema)
  .handler(async ({ data }) => {
    const prisma = await getServerSidePrismaClient();

    const existing = await prisma.equipment.findUnique({ where: { id: data.equipmentId } });
    if (!existing) {
      return {
        success: false as const,
        error: "NOT_FOUND" as const,
        message: mutationErrorMessages.equipmentNotFound,
      };
    }

    try {
      const equipment = await prisma.equipment.update({
        where: { id: data.equipmentId },
        data: { isActive: data.isActive },
      });

      return { success: true as const, equipment };
    } catch (error) {
      const code = mapEquipmentMutationError(error);
      logEquipmentMutationError("set-active-state", error, { equipmentId: data.equipmentId });
      return {
        success: false as const,
        error: code,
        message: getEquipmentMutationErrorMessage(code),
      };
    }
  });
