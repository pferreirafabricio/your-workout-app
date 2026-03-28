-- Add active movement pointer and durable workout queue ordering

ALTER TABLE "Workout"
  ADD COLUMN "activeMovementId" TEXT;

CREATE INDEX "Workout_activeMovementId_idx" ON "Workout"("activeMovementId");

ALTER TABLE "Workout"
  ADD CONSTRAINT "Workout_activeMovementId_fkey"
  FOREIGN KEY ("activeMovementId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorkoutQueueItem" (
  "id" TEXT NOT NULL,
  "workoutId" TEXT NOT NULL,
  "movementId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "isSkipped" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkoutQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkoutQueueItem_workoutId_movementId_key"
  ON "WorkoutQueueItem"("workoutId", "movementId");

CREATE UNIQUE INDEX "WorkoutQueueItem_workoutId_position_key"
  ON "WorkoutQueueItem"("workoutId", "position");

CREATE INDEX "WorkoutQueueItem_movementId_idx" ON "WorkoutQueueItem"("movementId");

CREATE INDEX "WorkoutQueueItem_workoutId_isSkipped_position_idx"
  ON "WorkoutQueueItem"("workoutId", "isSkipped", "position");

ALTER TABLE "WorkoutQueueItem"
  ADD CONSTRAINT "WorkoutQueueItem_workoutId_fkey"
  FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutQueueItem"
  ADD CONSTRAINT "WorkoutQueueItem_movementId_fkey"
  FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
