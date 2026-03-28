-- CreateTable
CREATE TABLE "NutritionFood" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "quantityUnit" "QuantityUnit" NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatsG" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionFood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionFood_userId_name_idx" ON "NutritionFood"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionFood_userId_name_key" ON "NutritionFood"("userId", "name");

-- AddForeignKey
ALTER TABLE "NutritionFood" ADD CONSTRAINT "NutritionFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
