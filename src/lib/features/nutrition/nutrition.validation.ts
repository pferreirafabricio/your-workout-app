import { z } from "zod";

export const nutritionMutationErrorMessages = {
  validationError: "Please fix the highlighted fields and try again.",
  nutritionEntryNotFound: "Nutrition entry not found.",
  nutritionFoodNotFound: "Saved food not found.",
  persistenceError: "We could not save your changes. Please try again.",
} as const;

export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: "Date must be in YYYY-MM-DD format." });

const nonNegativeMacro = z.number().min(0).max(5000);

export const nutritionQuantityUnitSchema = z.enum(["GRAMS", "SERVING"]);
export const nutritionGoalTypeSchema = z.enum(["CUT", "MAINTENANCE", "BULK"]);

export const getNutritionDailyLogInputSchema = z.object({
  date: localDateSchema.optional(),
});

export const createNutritionFoodEntryInputSchema = z.object({
  localDate: localDateSchema,
  name: z.string().trim().min(1).max(160),
  quantity: z.number().positive().max(100000),
  quantityUnit: nutritionQuantityUnitSchema,
  proteinG: nonNegativeMacro,
  carbsG: nonNegativeMacro,
  fatsG: nonNegativeMacro,
  caloriesEntered: z.number().min(0).max(50000),
});

export const updateNutritionFoodEntryInputSchema = z
  .object({
    entryId: z.string().min(1),
    name: z.string().trim().min(1).max(160).optional(),
    quantity: z.number().positive().max(100000).optional(),
    quantityUnit: nutritionQuantityUnitSchema.optional(),
    proteinG: nonNegativeMacro.optional(),
    carbsG: nonNegativeMacro.optional(),
    fatsG: nonNegativeMacro.optional(),
    caloriesEntered: z.number().min(0).max(50000).optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.quantity !== undefined ||
      value.quantityUnit !== undefined ||
      value.proteinG !== undefined ||
      value.carbsG !== undefined ||
      value.fatsG !== undefined ||
      value.caloriesEntered !== undefined,
    { message: "At least one field must be provided." },
  );

export const deleteNutritionFoodEntryInputSchema = z.object({
  entryId: z.string().min(1),
});

export const upsertNutritionGoalsInputSchema = z.object({
  calorieTarget: z.number().int().positive().max(20000),
  proteinTargetG: nonNegativeMacro,
  carbsTargetG: nonNegativeMacro,
  fatsTargetG: nonNegativeMacro,
  goalType: nutritionGoalTypeSchema,
});

export const createNutritionFoodInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  defaultQuantity: z.number().positive().max(100000),
  quantityUnit: nutritionQuantityUnitSchema,
  calories: z.number().min(0).max(50000),
  proteinG: nonNegativeMacro,
  carbsG: nonNegativeMacro,
  fatsG: nonNegativeMacro,
});

export const updateNutritionFoodInputSchema = z
  .object({
    foodId: z.string().min(1),
    name: z.string().trim().min(1).max(160).optional(),
    defaultQuantity: z.number().positive().max(100000).optional(),
    quantityUnit: nutritionQuantityUnitSchema.optional(),
    calories: z.number().min(0).max(50000).optional(),
    proteinG: nonNegativeMacro.optional(),
    carbsG: nonNegativeMacro.optional(),
    fatsG: nonNegativeMacro.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.defaultQuantity !== undefined ||
      value.quantityUnit !== undefined ||
      value.calories !== undefined ||
      value.proteinG !== undefined ||
      value.carbsG !== undefined ||
      value.fatsG !== undefined,
    { message: "At least one field must be provided." },
  );

export const deleteNutritionFoodInputSchema = z.object({
  foodId: z.string().min(1),
});

export const getNutritionHistoryInputSchema = z
  .object({
    startDate: localDateSchema,
    endDate: localDateSchema,
    includeBodyWeight: z.boolean().optional(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after start date.",
  });
