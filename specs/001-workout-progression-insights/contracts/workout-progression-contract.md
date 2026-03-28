# Contract: Workout Progression Feature Interfaces

## Scope
Defines request/response and behavior contracts for feature-critical server functions and route data boundaries.

## Conventions
- All mutation inputs are validated on the frontend before submission and revalidated on the backend before mutation.
- All responses return either success payloads or structured errors.
- Authenticated operations require valid session context.
- Weight values are exposed in user-preferred display unit, but metrics use canonical stored snapshots.

## Mutation Contracts

### Create/Update/Archive Movement
- Operation: `createMovement`, `updateMovement`, `archiveMovement`
- Input:
  - `name` (required, non-empty)
  - `type` (`weighted|bodyweight`)
  - `muscleGroup` (optional enum: `chest|back|shoulders|biceps|triceps|quads|hamstrings|glutes|calves|core|full_body`)
  - `equipmentId` (optional, must reference equipment catalog)
- Behavior:
  - Archived movements cannot be selected in active workout add-flow.
  - Archiving preserves historical references.
- Errors:
  - `VALIDATION_ERROR`
  - `INVALID_MUSCLE_GROUP`
  - `INVALID_EQUIPMENT`
  - `DUPLICATE_NAME`
  - `NOT_FOUND`

### Add/Update/Delete Set
- Operation: `addSet`, `updateSet`, `deleteSet`
- Input:
  - `movementId`
  - `reps`
  - `weight` (optional for bodyweight auto-fill path)
  - `rpe` (optional)
  - `notes` (optional)
  - `loggedAt` (optional, defaults to now)
- Behavior:
  - Bodyweight movement defaults from latest bodyweight entry.
  - Final set value is persisted as immutable snapshot semantics.
  - Concurrent updates use last-write-wins; replacement notice is returned.
- Errors:
  - `NO_ACTIVE_WORKOUT`
  - `MOVEMENT_ARCHIVED`
  - `MISSING_BODYWEIGHT_CONTEXT`
  - `VALIDATION_ERROR`

### Complete Workout
- Operation: `completeWorkout`
- Input: none (operates on active workout)
- Behavior:
  - Sets completion timestamp.
  - Returns computed summary (duration, total volume, movement stats).
- Errors:
  - `NO_ACTIVE_WORKOUT`

### Set User Preferences
- Operation: `setUserPreferences`
- Input:
  - `weightUnit` (`kg|lbs`)
  - `defaultRestTargetSeconds` (optional)
- Behavior:
  - Takes effect globally for future display/input rendering.
- Errors:
  - `VALIDATION_ERROR`

### Record Body Weight
- Operation: `recordBodyWeight`
- Input:
  - `weight`
  - `unit` (`kg|lbs`)
  - `recordedAt` (date/time)
- Behavior:
  - Used for trends and bodyweight defaults on future bodyweight sets.
- Errors:
  - `VALIDATION_ERROR`

## Query Contracts

### Get Current Workout
- Operation: `getCurrentWorkout`
- Returns:
  - Active workout with ordered sets
  - Derived rest timer baseline (`lastSetLoggedAt`) and optional target

### Get Workout History
- Operation: `getWorkoutHistory`
- Filters:
  - Date range
  - Movement
- Returns:
  - Completed workouts with movement-grouped summaries and total volume

### Get Progression Series
- Operation: `getProgressionSeries`
- Inputs:
  - `movementId`
  - `metric` (`maxWeight|totalReps|totalVolume`)
  - Date range
- Returns:
  - Chronological points `{date, value}`

### Get Body Weight Series
- Operation: `getBodyWeightSeries`
- Inputs:
  - Date range
- Returns:
  - Chronological points `{date, weight}`

### Get Equipment Catalog
- Operation: `getEquipmentCatalog`
- Inputs:
  - Optional search text
  - Optional active-only filter
- Returns:
  - Ordered catalog list `{id, code, name, isActive, displayOrder}`

## Security Contracts

### Sign In
- Operation: `signIn`
- Behavior:
  - Password verification uses adaptive hash compare.
  - On >=5 failed attempts within 15 minutes (per account + client source), lock sign-in for 15 minutes.
- Errors:
  - `INVALID_CREDENTIALS`
  - `LOCKED_OUT` (includes remaining lockout duration)

### Session/CSRF
- Mutations require anti-CSRF verification and authenticated session when protected.
- Cookie/session attributes must remain secure defaults in production.

## Test Contract Mapping
- Unit tests:
  - Metric calculations, unit conversions, lockout/window logic.
- Integration tests:
  - Route + server function boundaries for active workout, history filters, progression query outputs.
- E2E tests:
  - Movement CRUD (archive behavior), sets CRUD, workout complete/history, bodyweight defaulting, rest timer behavior, sign-in lockout behavior.
