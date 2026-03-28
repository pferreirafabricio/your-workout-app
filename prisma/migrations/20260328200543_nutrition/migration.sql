-- CreateEnum
CREATE TYPE "QuantityUnit" AS ENUM ('GRAMS', 'SERVING');

-- CreateEnum
CREATE TYPE "NutritionGoalType" AS ENUM ('CUT', 'MAINTENANCE', 'BULK');

-- CreateTable
CREATE TABLE "NutritionDailyLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "totalProteinG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbsG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFatsG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCaloriesCanonical" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCaloriesEntered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionDailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionFoodEntry" (
    "id" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityUnit" "QuantityUnit" NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatsG" DOUBLE PRECISION NOT NULL,
    "caloriesEntered" DOUBLE PRECISION NOT NULL,
    "caloriesCanonical" DOUBLE PRECISION NOT NULL,
    "hasCalorieMismatch" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionFoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calorieTarget" INTEGER NOT NULL,
    "proteinTargetG" DOUBLE PRECISION NOT NULL,
    "carbsTargetG" DOUBLE PRECISION NOT NULL,
    "fatsTargetG" DOUBLE PRECISION NOT NULL,
    "goalType" "NutritionGoalType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionDailyLog_userId_localDate_idx" ON "NutritionDailyLog"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionDailyLog_userId_localDate_key" ON "NutritionDailyLog"("userId", "localDate");

-- CreateIndex
CREATE INDEX "NutritionFoodEntry_dailyLogId_updatedAt_idx" ON "NutritionFoodEntry"("dailyLogId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionGoal_userId_key" ON "NutritionGoal"("userId");

-- AddForeignKey
ALTER TABLE "NutritionDailyLog" ADD CONSTRAINT "NutritionDailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionFoodEntry" ADD CONSTRAINT "NutritionFoodEntry_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "NutritionDailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionGoal" ADD CONSTRAINT "NutritionGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
