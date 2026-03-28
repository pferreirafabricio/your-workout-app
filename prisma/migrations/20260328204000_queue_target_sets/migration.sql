-- Add target set count per workout queue item

ALTER TABLE "WorkoutQueueItem"
  ADD COLUMN "targetSets" INTEGER NOT NULL DEFAULT 3;
