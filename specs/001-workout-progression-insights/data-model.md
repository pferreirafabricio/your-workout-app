# Data Model: Workout Progression Insights

## Overview
This feature extends the existing workout domain to support progression analytics, bodyweight context, secure auth, and resilient logging behavior.

## Entities

### User (existing, extended)
- Purpose: Account owner and data partition key.
- Key fields:
  - `id` (UUID, PK)
  - `email` (unique, normalized)
  - `name` (optional)
  - `passwordHash` (required, adaptive hash)
  - `createdAt`, `updatedAt`
- Relationships:
  - One-to-many `Workout`
  - One-to-many `BodyWeightEntry`
  - One-to-one `UserPreference`
  - One-to-many `AuthLockoutEvent`
- Validation:
  - Email format enforced server-side.
  - Password hash never null for credential accounts.

### UserPreference (new)
- Purpose: Per-user configuration for unit and optional rest defaults.
- Key fields:
  - `userId` (PK/FK -> User)
  - `weightUnit` (enum: `kg`, `lbs`)
  - `defaultRestTargetSeconds` (nullable int)
  - `updatedAt`
- Validation:
  - Rest target bounds (for example 15..600 seconds).

### Movement (existing, extended)
- Purpose: Reusable exercise definition.
- Key fields:
  - `id` (UUID, PK)
  - `name` (string, user-scoped uniqueness or normalized uniqueness policy)
  - `type` (enum: `weighted`, `bodyweight`)
  - `defaultUnit` (enum, canonical default `kg`)
  - `muscleGroup` (nullable enum: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`, `calves`, `core`, `full_body`)
  - `equipmentId` (nullable FK -> Equipment)
  - `archivedAt` (nullable timestamp)
  - `createdAt`, `updatedAt`
- Relationships:
  - One-to-many `SetEntry`
  - Many-to-one `Equipment` (optional)
- Validation:
  - Archived movements cannot be attached to newly created sets.

### Equipment (new)
- Purpose: Controlled equipment catalog for movement classification.
- Key fields:
  - `id` (UUID, PK)
  - `code` (unique, stable slug)
  - `name` (unique display name)
  - `isActive` (boolean)
  - `displayOrder` (int)
  - `createdAt`, `updatedAt`
- Relationships:
  - One-to-many `Movement`
- Seed requirement:
  - Table is prepopulated via migration/seed with baseline values such as `barbell`, `dumbbell`, `kettlebell`, `machine`, `cable`, `bodyweight`, `resistance_band`, `bench`, `pull_up_bar`, `other`.

### Workout (existing, extended)
- Purpose: User training session container.
- Key fields:
  - `id` (UUID, PK)
  - `userId` (FK -> User)
  - `name` (nullable)
  - `startedAt` (timestamp)
  - `completedAt` (nullable timestamp)
  - `createdAt`, `updatedAt`
- Derived values:
  - `durationSeconds = completedAt - startedAt` when completed.
  - `totalVolume = sum(set.weightSnapshot * set.reps)`.
- Validation:
  - Only one active workout per user unless explicitly expanded in later scope.

### SetEntry (existing `Set`, extended)
- Purpose: Atomic effort record used for progression calculations.
- Key fields:
  - `id` (UUID, PK)
  - `workoutId` (FK -> Workout)
  - `movementId` (FK -> Movement)
  - `reps` (int > 0)
  - `weightSnapshot` (decimal/int >= 0, immutable once persisted except explicit set edit)
  - `loggedAt` (timestamp)
  - `rpe` (nullable decimal, bounds 1..10)
  - `notes` (nullable text, max length bounded)
  - `version` (int, optimistic tracking for conflict awareness)
  - `updatedAt`
- Derived values:
  - `setVolume = reps * weightSnapshot`
- Validation:
  - Last-write-wins on conflicting edits; conflict notice emitted when replacement occurs.

### BodyWeightEntry (new)
- Purpose: Time-series body weight context for defaults and trends.
- Key fields:
  - `id` (UUID, PK)
  - `userId` (FK -> User)
  - `weight` (decimal/int > 0)
  - `unit` (enum: `kg`, `lbs`)
  - `recordedAt` (timestamp/date)
  - `createdAt`
- Validation:
  - Entries sorted by `recordedAt`; latest prior entry is used for bodyweight defaulting.

### AuthLockoutEvent / LoginAttemptCounter (new)
- Purpose: Enforce anti-bruteforce threshold.
- Key fields:
  - `id` (UUID, PK)
  - `userId` (nullable if email unknown)
  - `emailFingerprint` (normalized email hash)
  - `clientSource` (IP/device fingerprint bucket)
  - `failedAttemptCount`
  - `windowStartedAt`
  - `lockedUntil` (nullable timestamp)
  - `updatedAt`
- Validation:
  - Lockout set to 15 minutes after 5 failed attempts in 15-minute window.

## Relationships Summary
- `User 1..* Workout`
- `Workout 1..* SetEntry`
- `Movement 1..* SetEntry`
- `Equipment 1..* Movement`
- `User 1..* BodyWeightEntry`
- `User 1..1 UserPreference`
- `User 1..* AuthLockoutEvent`

## State Transitions

### Workout lifecycle
1. `active` (`completedAt = null`) when created.
2. `completed` (`completedAt != null`) when user completes workout.
3. Historical read-only behaviors for analytics; sets may still be edited/deleted only if policy allows (v1 scope supports edits/deletes with recalculation).

### Movement lifecycle
1. `active` (`archivedAt = null`) available for new logging.
2. `archived` (`archivedAt != null`) hidden from new selection, still referenced in history.

### Lockout lifecycle
1. `open` while failed attempts < 5 in current 15-minute window.
2. `locked` once threshold reached; remains locked until `lockedUntil`.
3. `open` again after lockout expires or successful authenticated reset.

## Metric Definitions
- `setVolume = weightSnapshot * reps`
- `workoutTotalVolume = sum(setVolume for workout)`
- `movementDailyMaxWeight = max(weightSnapshot per movement per day)`
- `movementDailyTotalReps = sum(reps per movement per day)`

## Indexing and Query Notes
- Index `Workout(userId, completedAt)` for active workout lookup/history sorting.
- Index `SetEntry(workoutId, loggedAt)` for chronology and timer derivation.
- Index `SetEntry(movementId, loggedAt)` for progression queries.
- Index `Movement(equipmentId, archivedAt)` for movement selection/filtering.
- Index `BodyWeightEntry(userId, recordedAt desc)` for latest-bodyweight default retrieval.
- Unique index `Equipment(code)` and `Equipment(name)` for controlled catalog integrity.
- Index lockout keys by `(emailFingerprint, clientSource)` and `(lockedUntil)` for fast auth checks.
