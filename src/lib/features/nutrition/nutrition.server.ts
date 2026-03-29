import { createServerFn } from "@tanstack/react-start";
import { authMiddleware, csrfProtectionMiddleware } from "@/lib/features/auth/auth.server";
import { getServerSidePrismaClient } from "@/lib/core/db.server";
import {
  calculateCanonicalCalories,
  calculateMacroPercentages,
  computeBalanceLabel,
  dateToLocalDateString,
  defaultHistoryRange,
  hasCalorieMismatch,
  getLocalDateString,
} from "@/lib/features/nutrition/nutrition.domain";
import {
  createNutritionFoodInputSchema,
  createNutritionFoodEntryInputSchema,
  deleteNutritionFoodInputSchema,
  deleteNutritionFoodEntryInputSchema,
  getNutritionDailyLogInputSchema,
  getNutritionHistoryInputSchema,
  nutritionMutationErrorMessages,
  updateNutritionFoodInputSchema,
  updateNutritionFoodEntryInputSchema,
  upsertNutritionGoalsInputSchema,
} from "@/lib/features/nutrition/nutrition.validation";
import { Prisma } from "../../../../prisma/generated/client/client";

type NutritionNoticeCode = "CALORIE_MISMATCH" | "CONFLICT_REFRESHED" | "GOALS_REQUIRED";

type NutritionNotice = {
  code: NutritionNoticeCode;
  message: string;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getConflictNotice(): NutritionNotice {
  return {
    code: "CONFLICT_REFRESHED",
    message: "This entry changed in another session. Latest values were loaded.",
  };
}

function getMismatchNotice(): NutritionNotice {
  return {
    code: "CALORIE_MISMATCH",
    message: "Entered calories differ from macro-derived calories. Balance uses macro-derived calories.",
  };
}

function getGoalsRequiredNotice(): NutritionNotice {
  return {
    code: "GOALS_REQUIRED",
    message: "Set nutrition goals to unlock remaining calories and surplus/deficit metrics.",
  };
}

async function getUserTimeZone(prisma: Awaited<ReturnType<typeof getServerSidePrismaClient>>, userId: string): Promise<string> {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { timeZone: true },
  });

  return preference?.timeZone ?? "UTC";
}

async function getOrCreateDailyLog(
  prisma: Awaited<ReturnType<typeof getServerSidePrismaClient>>,
  userId: string,
  localDate: string,
  timeZone: string,
) {
  const existing = await prisma.nutritionDailyLog.findUnique({
    where: {
      userId_localDate: {
        userId,
        localDate,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.nutritionDailyLog.create({
    data: {
      userId,
      localDate,
      timeZone,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatsG: 0,
      totalCaloriesCanonical: 0,
      totalCaloriesEntered: 0,
    },
  });
}

async function recomputeDailyLogTotals(
  prisma: Awaited<ReturnType<typeof getServerSidePrismaClient>>,
  dailyLogId: string,
) {
  const entries = await prisma.nutritionFoodEntry.findMany({
    where: { dailyLogId },
    select: {
      proteinG: true,
      carbsG: true,
      fatsG: true,
      caloriesEntered: true,
      caloriesCanonical: true,
    },
  });

  const totals = entries.reduce(
    (acc, entry) => {
      acc.proteinG += entry.proteinG;
      acc.carbsG += entry.carbsG;
      acc.fatsG += entry.fatsG;
      acc.caloriesEntered += entry.caloriesEntered;
      acc.caloriesCanonical += entry.caloriesCanonical;
      return acc;
    },
    {
      proteinG: 0,
      carbsG: 0,
      fatsG: 0,
      caloriesEntered: 0,
      caloriesCanonical: 0,
    },
  );

  return prisma.nutritionDailyLog.update({
    where: { id: dailyLogId },
    data: {
      totalProteinG: round2(totals.proteinG),
      totalCarbsG: round2(totals.carbsG),
      totalFatsG: round2(totals.fatsG),
      totalCaloriesEntered: round2(totals.caloriesEntered),
      totalCaloriesCanonical: round2(totals.caloriesCanonical),
    },
  });
}

function mapPersistenceError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return nutritionMutationErrorMessages.nutritionEntryNotFound;
  }

  return nutritionMutationErrorMessages.persistenceError;
}

export const getNutritionDailyLogServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getNutritionDailyLogInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();
    const userId = context.user.id;
    const timeZone = await getUserTimeZone(prisma, userId);
    const localDate = data.date ?? getLocalDateString(new Date(), timeZone);

    const dailyLog = await getOrCreateDailyLog(prisma, userId, localDate, timeZone);

    const [entries, goals] = await Promise.all([
      prisma.nutritionFoodEntry.findMany({
        where: { dailyLogId: dailyLog.id },
        orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
      }),
      prisma.nutritionGoal.findUnique({ where: { userId } }),
    ]);

    const percentages = calculateMacroPercentages({
      proteinG: dailyLog.totalProteinG,
      carbsG: dailyLog.totalCarbsG,
      fatsG: dailyLog.totalFatsG,
    });

    const notices: NutritionNotice[] = [];
    if (!goals) {
      notices.push(getGoalsRequiredNotice());
    }

    const goalContext: {
      hasGoals: boolean;
      calorieTarget?: number;
      proteinTargetG?: number;
      carbsTargetG?: number;
      fatsTargetG?: number;
      goalType?: "CUT" | "MAINTENANCE" | "BULK";
      remainingCalories?: number;
      balanceCalories?: number;
      balanceLabel?: "SURPLUS" | "DEFICIT" | "ON_TARGET";
    } = {
      hasGoals: Boolean(goals),
    };

    if (goals) {
      const balanceCalories = round2(dailyLog.totalCaloriesCanonical - goals.calorieTarget);
      const remainingCalories = round2(goals.calorieTarget - dailyLog.totalCaloriesCanonical);
      goalContext.calorieTarget = goals.calorieTarget;
      goalContext.proteinTargetG = goals.proteinTargetG;
      goalContext.carbsTargetG = goals.carbsTargetG;
      goalContext.fatsTargetG = goals.fatsTargetG;
      goalContext.goalType = goals.goalType;
      goalContext.remainingCalories = remainingCalories;
      goalContext.balanceCalories = balanceCalories;
      goalContext.balanceLabel = computeBalanceLabel(balanceCalories);
    }

    return {
      localDate,
      timeZone,
      entries: entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        quantity: entry.quantity,
        quantityUnit: entry.quantityUnit,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatsG: entry.fatsG,
        caloriesEntered: entry.caloriesEntered,
        caloriesCanonical: entry.caloriesCanonical,
        hasCalorieMismatch: entry.hasCalorieMismatch,
        updatedAt: entry.updatedAt.toISOString(),
      })),
      totals: {
        proteinG: dailyLog.totalProteinG,
        carbsG: dailyLog.totalCarbsG,
        fatsG: dailyLog.totalFatsG,
        caloriesEntered: dailyLog.totalCaloriesEntered,
        caloriesCanonical: dailyLog.totalCaloriesCanonical,
        proteinPct: percentages.proteinPct,
        carbsPct: percentages.carbsPct,
        fatsPct: percentages.fatsPct,
      },
      goalContext,
      notices,
    };
  });

export const createNutritionFoodEntryServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(createNutritionFoodEntryInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();
    const userId = context.user.id;
    const timeZone = await getUserTimeZone(prisma, userId);
    const dailyLog = await getOrCreateDailyLog(prisma, userId, data.localDate, timeZone);

    try {
      const caloriesCanonical = calculateCanonicalCalories({
        proteinG: data.proteinG,
        carbsG: data.carbsG,
        fatsG: data.fatsG,
      });

      const entry = await prisma.nutritionFoodEntry.create({
        data: {
          dailyLogId: dailyLog.id,
          name: data.name,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          proteinG: data.proteinG,
          carbsG: data.carbsG,
          fatsG: data.fatsG,
          caloriesEntered: data.caloriesEntered,
          caloriesCanonical,
          hasCalorieMismatch: hasCalorieMismatch(data.caloriesEntered, caloriesCanonical),
        },
      });

      await recomputeDailyLogTotals(prisma, dailyLog.id);

      return {
        success: true as const,
        entryId: entry.id,
        notices: entry.hasCalorieMismatch ? [getMismatchNotice()] : [],
      };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const updateNutritionFoodEntryServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(updateNutritionFoodEntryInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();
    const existing = await prisma.nutritionFoodEntry.findUnique({
      where: { id: data.entryId },
      include: { dailyLog: true },
    });

    if (!existing || existing.dailyLog.userId !== context.user.id) {
      return { success: false as const, error: nutritionMutationErrorMessages.nutritionEntryNotFound };
    }

    const notices: NutritionNotice[] = [];
    if (data.updatedAt && new Date(data.updatedAt).getTime() !== existing.updatedAt.getTime()) {
      notices.push(getConflictNotice());
    }

    const nextProtein = data.proteinG ?? existing.proteinG;
    const nextCarbs = data.carbsG ?? existing.carbsG;
    const nextFats = data.fatsG ?? existing.fatsG;
    const nextCaloriesEntered = data.caloriesEntered ?? existing.caloriesEntered;
    const nextCaloriesCanonical = calculateCanonicalCalories({
      proteinG: nextProtein,
      carbsG: nextCarbs,
      fatsG: nextFats,
    });

    try {
      const updated = await prisma.nutritionFoodEntry.update({
        where: { id: data.entryId },
        data: {
          name: data.name ?? existing.name,
          quantity: data.quantity ?? existing.quantity,
          quantityUnit: data.quantityUnit ?? existing.quantityUnit,
          proteinG: nextProtein,
          carbsG: nextCarbs,
          fatsG: nextFats,
          caloriesEntered: nextCaloriesEntered,
          caloriesCanonical: nextCaloriesCanonical,
          hasCalorieMismatch: hasCalorieMismatch(nextCaloriesEntered, nextCaloriesCanonical),
        },
      });

      await recomputeDailyLogTotals(prisma, existing.dailyLogId);

      if (updated.hasCalorieMismatch) {
        notices.push(getMismatchNotice());
      }

      return { success: true as const, notices };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const deleteNutritionFoodEntryServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(deleteNutritionFoodEntryInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();
    const existing = await prisma.nutritionFoodEntry.findUnique({
      where: { id: data.entryId },
      include: { dailyLog: true },
    });

    if (!existing || existing.dailyLog.userId !== context.user.id) {
      return { success: false as const, error: nutritionMutationErrorMessages.nutritionEntryNotFound };
    }

    try {
      await prisma.nutritionFoodEntry.delete({ where: { id: data.entryId } });
      await recomputeDailyLogTotals(prisma, existing.dailyLogId);
      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const upsertNutritionGoalsServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(upsertNutritionGoalsInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();

    try {
      const goal = await prisma.nutritionGoal.upsert({
        where: { userId: context.user.id },
        create: {
          userId: context.user.id,
          calorieTarget: data.calorieTarget,
          proteinTargetG: data.proteinTargetG,
          carbsTargetG: data.carbsTargetG,
          fatsTargetG: data.fatsTargetG,
          goalType: data.goalType,
        },
        update: {
          calorieTarget: data.calorieTarget,
          proteinTargetG: data.proteinTargetG,
          carbsTargetG: data.carbsTargetG,
          fatsTargetG: data.fatsTargetG,
          goalType: data.goalType,
        },
      });

      return {
        success: true as const,
        goal: {
          calorieTarget: goal.calorieTarget,
          proteinTargetG: goal.proteinTargetG,
          carbsTargetG: goal.carbsTargetG,
          fatsTargetG: goal.fatsTargetG,
          goalType: goal.goalType,
        },
      };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const getNutritionGoalsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const goals = await prisma.nutritionGoal.findUnique({
      where: { userId: context.user.id },
      select: {
        calorieTarget: true,
        proteinTargetG: true,
        carbsTargetG: true,
        fatsTargetG: true,
        goalType: true,
      },
    });

    return {
      hasGoals: Boolean(goals),
      goals,
    };
  });

export const listNutritionFoodsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();

    const foods = await prisma.nutritionFood.findMany({
      where: { userId: context.user.id },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });

    return {
      foods: foods.map((food) => ({
        id: food.id,
        name: food.name,
        defaultQuantity: food.defaultQuantity,
        quantityUnit: food.quantityUnit,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatsG: food.fatsG,
        updatedAt: food.updatedAt.toISOString(),
      })),
    };
  });

export const createNutritionFoodServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(createNutritionFoodInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();

    try {
      const created = await prisma.nutritionFood.create({
        data: {
          userId: context.user.id,
          name: data.name,
          defaultQuantity: data.defaultQuantity,
          quantityUnit: data.quantityUnit,
          calories: data.calories,
          proteinG: data.proteinG,
          carbsG: data.carbsG,
          fatsG: data.fatsG,
        },
      });

      return {
        success: true as const,
        foodId: created.id,
      };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const updateNutritionFoodServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(updateNutritionFoodInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();

    const existing = await prisma.nutritionFood.findUnique({ where: { id: data.foodId } });
    if (!existing || existing.userId !== context.user.id) {
      return {
        success: false as const,
        error: nutritionMutationErrorMessages.nutritionFoodNotFound,
      };
    }

    try {
      await prisma.nutritionFood.update({
        where: { id: data.foodId },
        data: {
          name: data.name ?? existing.name,
          defaultQuantity: data.defaultQuantity ?? existing.defaultQuantity,
          quantityUnit: data.quantityUnit ?? existing.quantityUnit,
          calories: data.calories ?? existing.calories,
          proteinG: data.proteinG ?? existing.proteinG,
          carbsG: data.carbsG ?? existing.carbsG,
          fatsG: data.fatsG ?? existing.fatsG,
        },
      });

      return {
        success: true as const,
      };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const deleteNutritionFoodServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware, authMiddleware])
  .inputValidator(deleteNutritionFoodInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();

    const existing = await prisma.nutritionFood.findUnique({ where: { id: data.foodId } });
    if (!existing || existing.userId !== context.user.id) {
      return {
        success: false as const,
        error: nutritionMutationErrorMessages.nutritionFoodNotFound,
      };
    }

    try {
      await prisma.nutritionFood.delete({ where: { id: data.foodId } });
      return {
        success: true as const,
      };
    } catch (error) {
      return {
        success: false as const,
        error: mapPersistenceError(error),
      };
    }
  });

export const getNutritionHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getNutritionHistoryInputSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();
    const userId = context.user.id;
    const timeZone = await getUserTimeZone(prisma, userId);
    const includeBodyWeight = data.includeBodyWeight ?? false;

    const logs = await prisma.nutritionDailyLog.findMany({
      where: {
        userId,
        localDate: {
          gte: data.startDate,
          lte: data.endDate,
        },
      },
      orderBy: { localDate: "asc" },
    });

    const bodyWeightByDate = new Map<string, number>();
    if (includeBodyWeight) {
      const weightEntries = await prisma.bodyWeightEntry.findMany({
        where: { userId },
        orderBy: { recordedAt: "asc" },
      });
      for (const item of weightEntries) {
        const localDate = dateToLocalDateString(item.recordedAt, timeZone);
        if (localDate >= data.startDate && localDate <= data.endDate) {
          bodyWeightByDate.set(localDate, item.weightKg);
        }
      }
    }

    return {
      points: logs.map((log) => {
        const percentages = calculateMacroPercentages({
          proteinG: log.totalProteinG,
          carbsG: log.totalCarbsG,
          fatsG: log.totalFatsG,
        });

        return {
          localDate: log.localDate,
          caloriesCanonical: log.totalCaloriesCanonical,
          proteinG: log.totalProteinG,
          carbsG: log.totalCarbsG,
          fatsG: log.totalFatsG,
          proteinPct: percentages.proteinPct,
          carbsPct: percentages.carbsPct,
          fatsPct: percentages.fatsPct,
          bodyWeight: includeBodyWeight ? bodyWeightByDate.get(log.localDate) ?? null : null,
        };
      }),
    };
  });

export const getNutritionDefaultsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const timeZone = await getUserTimeZone(prisma, context.user.id);
    const today = getLocalDateString(new Date(), timeZone);
    return {
      timeZone,
      today,
      historyRange: defaultHistoryRange(timeZone),
    };
  });
