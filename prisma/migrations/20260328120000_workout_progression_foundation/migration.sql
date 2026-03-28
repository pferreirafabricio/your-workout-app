-- Foundation schema updates for workout progression insights

-- Enums
CREATE TYPE "MovementType" AS ENUM ('WEIGHTED', 'BODYWEIGHT');
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LBS');
CREATE TYPE "MuscleGroup" AS ENUM (
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'CORE',
  'FULL_BODY'
);

-- User auth hardening + lockout fields
ALTER TABLE "User"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "failedSignInAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failedSignInWindowAt" TIMESTAMP(3),
  ADD COLUMN "lockedOutUntil" TIMESTAMP(3);

UPDATE "User" SET "passwordHash" = "password" WHERE "passwordHash" IS NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "password";

-- Equipment catalog
CREATE TABLE "Equipment" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");
CREATE UNIQUE INDEX "Equipment_name_key" ON "Equipment"("name");
CREATE INDEX "Equipment_isActive_displayOrder_idx" ON "Equipment"("isActive", "displayOrder");

-- User preferences
CREATE TABLE "UserPreference" (
  "userId" TEXT NOT NULL,
  "weightUnit" "WeightUnit" NOT NULL DEFAULT 'KG',
  "defaultRestTargetSeconds" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserPreference"
  ADD CONSTRAINT "UserPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Body weight entries
CREATE TABLE "BodyWeightEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "originalUnit" "WeightUnit" NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BodyWeightEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BodyWeightEntry_userId_recordedAt_idx" ON "BodyWeightEntry"("userId", "recordedAt");

ALTER TABLE "BodyWeightEntry"
  ADD CONSTRAINT "BodyWeightEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lockout events
CREATE TABLE "AuthLockoutEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "emailFingerprint" TEXT NOT NULL,
  "clientSource" TEXT NOT NULL,
  "failedAttempts" INTEGER NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "lockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthLockoutEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthLockoutEvent_emailFingerprint_clientSource_key"
  ON "AuthLockoutEvent"("emailFingerprint", "clientSource");
CREATE INDEX "AuthLockoutEvent_lockedUntil_idx" ON "AuthLockoutEvent"("lockedUntil");

ALTER TABLE "AuthLockoutEvent"
  ADD CONSTRAINT "AuthLockoutEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Movement metadata and archival support
ALTER TABLE "Movement"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "type" "MovementType" NOT NULL DEFAULT 'WEIGHTED',
  ADD COLUMN "defaultUnit" "WeightUnit" NOT NULL DEFAULT 'KG',
  ADD COLUMN "muscleGroup" "MuscleGroup",
  ADD COLUMN "equipmentId" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Movement" m
SET "userId" = (
  SELECT w."userId"
  FROM "Set" s
  JOIN "Workout" w ON w."id" = s."workoutId"
  WHERE s."movementId" = m."id"
  LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Movement" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Movement_userId_archivedAt_idx" ON "Movement"("userId", "archivedAt");
CREATE INDEX "Movement_equipmentId_archivedAt_idx" ON "Movement"("equipmentId", "archivedAt");
CREATE UNIQUE INDEX "Movement_userId_name_key" ON "Movement"("userId", "name");

ALTER TABLE "Movement"
  ADD CONSTRAINT "Movement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Movement"
  ADD CONSTRAINT "Movement_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Workout metadata fields
ALTER TABLE "Workout"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Workout" SET "startedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP);
CREATE INDEX "Workout_userId_completedAt_startedAt_idx" ON "Workout"("userId", "completedAt", "startedAt");

-- Set metadata + snapshots
ALTER TABLE "Set"
  ADD COLUMN "weightSnapshotKg" DOUBLE PRECISION,
  ADD COLUMN "bodyWeightSnapshot" DOUBLE PRECISION,
  ADD COLUMN "rpe" DOUBLE PRECISION,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Set" SET "weightSnapshotKg" = "weight";
ALTER TABLE "Set" ALTER COLUMN "weightSnapshotKg" SET NOT NULL;
ALTER TABLE "Set" DROP COLUMN "weight";

CREATE INDEX "Set_workoutId_loggedAt_idx" ON "Set"("workoutId", "loggedAt");
CREATE INDEX "Set_movementId_loggedAt_idx" ON "Set"("movementId", "loggedAt");

-- Equipment seed rows
INSERT INTO "Equipment" ("id", "code", "name", "isActive", "displayOrder", "createdAt", "updatedAt") VALUES
  ('equipment-barbell', 'barbell', 'Barbell', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-dumbbell', 'dumbbell', 'Dumbbell', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-kettlebell', 'kettlebell', 'Kettlebell', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-machine', 'machine', 'Machine', true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-cable', 'cable', 'Cable', true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-bodyweight', 'bodyweight', 'Bodyweight', true, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-resistance-band', 'resistance_band', 'Resistance Band', true, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-bench', 'bench', 'Bench', true, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-pull-up-bar', 'pull_up_bar', 'Pull Up Bar', true, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('equipment-other', 'other', 'Other', true, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
