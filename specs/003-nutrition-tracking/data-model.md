# Data Model: Nutrition Tracking

## Overview
This feature introduces nutrition-domain entities for daily food logging, user nutrition goals, and history/correlation views while integrating with existing body-weight records.

## Entities

### NutritionDailyLog (new)
- Purpose: Represents one user’s nutrition totals for one local calendar day.
- Key fields:
  - `id` (UUID, PK)
  - `userId` (FK)
  - `localDate` (date string in user timezone context, unique per user/day)
  - `timeZone` (IANA timezone used for day attribution)
  - `totalProteinG` (decimal >= 0)
  - `totalCarbsG` (decimal >= 0)
  - `totalFatsG` (decimal >= 0)
  - `totalCaloriesCanonical` (decimal >= 0; derived from macros)
  - `totalCaloriesEntered` (decimal >= 0; sum of entered calories)
  - `createdAt`, `updatedAt` (UTC timestamps)
- Relationships:
  - One-to-many with `NutritionFoodEntry`.
  - One-to-one logical relationship with `NutritionGoal` by user/day context for summary computations.
- Validation rules:
  - `(userId, localDate)` unique.
  - Totals recomputed from entries after every mutation.

### NutritionFoodEntry (new)
- Purpose: Represents a single food item logged within a daily log.
- Key fields:
  - `id` (UUID, PK)
  - `dailyLogId` (FK -> NutritionDailyLog)
  - `name` (string, required, trimmed)
  - `quantity` (decimal > 0)
  - `quantityUnit` (enum: `GRAMS` | `SERVING`)
  - `proteinG`, `carbsG`, `fatsG` (decimal >= 0)
  - `caloriesEntered` (decimal >= 0)
  - `caloriesCanonical` (decimal >= 0; derived from macros)
  - `hasCalorieMismatch` (boolean)
  - `version` (integer for optimistic write checks/logging)
  - `createdAt`, `updatedAt` (UTC timestamps)
- Validation rules:
  - Macros non-negative; quantity positive.
  - `caloriesCanonical = proteinG*4 + carbsG*4 + fatsG*9`.
  - Mismatch warning triggered when `caloriesEntered != caloriesCanonical` (threshold policy can be refined in tasks).

### NutritionGoal (new)
- Purpose: User-defined targets for calorie and macro guidance.
- Key fields:
  - `id` (UUID, PK)
  - `userId` (FK, unique for active goal profile)
  - `calorieTarget` (integer > 0)
  - `proteinTargetG`, `carbsTargetG`, `fatsTargetG` (decimal >= 0)
  - `goalType` (enum: `CUT` | `MAINTENANCE` | `BULK`)
  - `createdAt`, `updatedAt` (UTC timestamps)
- Validation rules:
  - All targets are required for goal-dependent metrics.
  - Exactly one active goal profile per user in MVP.

### NutritionHistoryPoint (derived view model)
- Purpose: Consumable chart point for history and correlation UIs.
- Key fields:
  - `localDate`
  - `caloriesCanonical`
  - `proteinG`, `carbsG`, `fatsG`
  - `proteinPct`, `carbsPct`, `fatsPct`
  - Optional joined `bodyWeight` from existing body-weight records for same local date.
- Validation rules:
  - Percentages sum to approximately 100%, subject to rounding.
  - Missing weight values are allowed and represented as null.

## Relationships
- `NutritionDailyLog 1 -> N NutritionFoodEntry`
- `User 1 -> N NutritionDailyLog`
- `User 1 -> 1 NutritionGoal`
- `NutritionHistoryPoint` combines `NutritionDailyLog` with existing body-weight data by user/localDate.

## State Transitions

### Food entry lifecycle
1. `created` when user logs a new food.
2. `updated` via inline edits (last write wins if concurrent updates occur).
3. `deleted` removes entry and triggers log total recomputation.

### Daily summary state
1. `goalsMissing`: consumed calories/macros shown, goal-dependent fields hidden.
2. `goalsConfigured`: remaining calories and surplus/deficit shown.
3. `mismatchPresent`: warning badge/notice displayed for affected entry/log while canonical calculations remain stable.

## Invariants
- Canonical calorie values are always macro-derived.
- Entered calories are preserved for display and edits.
- Daily totals are consistent with the current set of food entries.
- Day attribution is by user-local date; timestamps remain UTC.
- Conflict resolution is deterministic (last write wins), with user-visible non-blocking notice.

## Error Semantics
- Invalid numeric ranges or missing required fields: validation error.
- Missing or stale target configuration for goal-dependent displays: no mutation error; UI presents setup prompt and hides dependent metrics.
- Concurrency collision: update accepted per last-write-wins policy, with conflict notice for stale clients and forced totals refresh.

## Query and Indexing Notes
- Required indexes:
  - `NutritionDailyLog(userId, localDate)` unique + query index.
  - `NutritionFoodEntry(dailyLogId, updatedAt)` for ordered rendering and refresh.
  - `NutritionGoal(userId)` unique.
- History queries use bounded date ranges and return daily points; weekly aggregation remains out of MVP scope.
