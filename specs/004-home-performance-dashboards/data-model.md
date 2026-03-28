# Data Model: Home Performance Dashboards

## Overview
Home dashboard charting for this feature is primarily a derived-read model over existing workout set, nutrition daily log, and bodyweight data. No mandatory Prisma schema changes are required for MVP.

## Entities

### MovementDailyMetricPoint (derived)
- Purpose: Daily aggregate chart point for one selected movement and one selected movement metric.
- Source: Workout sets filtered by user, movement, and date range.
- Key fields:
  - `movementId` (string)
  - `metric` (`maxWeight` | `totalReps` | `totalVolume`)
  - `date` (YYYY-MM-DD, timezone-normalized)
  - `value` (number)
  - `unit` (`kg` for `maxWeight`, `reps` for `totalReps`, `kg*reps` for `totalVolume`)
- Aggregation rules:
  - `maxWeight`: max set `weightSnapshotKg` for movement/day
  - `totalReps`: sum of `reps` for movement/day
  - `totalVolume`: sum of `reps * weightSnapshotKg` for movement/day, rounded to 2 decimals
- Validation rules:
  - Points sorted by ascending `date`.
  - Exclude sets not owned by the authenticated user.
  - Empty result set is valid and maps to chart empty-state UI.

### NutritionDailyMetricPoint (derived)
- Purpose: Daily aggregate chart point for selected nutrition metric on dashboard.
- Source: Nutrition history points with optional bodyweight overlay.
- Key fields:
  - `metric` (`calories` | `protein` | `carbs` | `fats` | `bodyWeight`)
  - `date` (local date string)
  - `value` (number | null in source, normalized to chart-safe value list)
  - `unit` (`kcal` | `g` | `kg`)
- Mapping rules:
  - `calories` -> `caloriesCanonical`
  - `protein` -> `proteinG`
  - `carbs` -> `carbsG`
  - `fats` -> `fatsG`
  - `bodyWeight` -> `bodyWeight`
- Validation rules:
  - Null `bodyWeight` values are omitted from plotted points and never break rendering.
  - Date range boundaries are inclusive and user-scoped.

### DashboardChartPreference (session model)
- Purpose: Preserve currently selected chart controls in-session for user comprehension and continuity.
- Storage strategy (MVP): Route/search and in-memory UI state (no persisted DB model).
- Key fields:
  - `selectedMovementId`
  - `selectedMovementMetric`
  - `selectedNutritionMetric`
  - `startDate`
  - `endDate`
- Validation rules:
  - Invalid movement IDs fall back to first available movement or empty-selection state.
  - `startDate <= endDate` must be enforced before query execution.
  - Preference state must never leak across authenticated users.

## Relationships
- `MovementDailyMetricPoint` derives from many `Set` records grouped by timezone-normalized day.
- `NutritionDailyMetricPoint` derives from `NutritionDailyLog` daily totals plus optional joined `BodyWeightEntry` by local date.
- `DashboardChartPreference` references selected chart dimensions only; it does not own domain data.

## State Transitions

### Dashboard interaction lifecycle
1. `initialized`: default date range and initial metric selections loaded.
2. `configured`: user changes movement and/or metric selectors.
3. `loading`: query key changes trigger refetch.
4. `resolved`: chart points render or empty state displays.
5. `restored`: selections remain available when user revisits dashboard in same session.

## Invariants
- Chart data returned to dashboard is always scoped to the authenticated user.
- Movement metrics use canonical calculation definitions shared with progression logic.
- Nutrition points keep daily granularity and maintain date ordering.
- Empty datasets are expected states, not errors.

## Error Semantics
- Invalid date range or malformed selector input: validation error shown as user-actionable state.
- Missing movement history or nutrition history: empty-state message with logging guidance.
- Deleted/invalid movement references in historical sets: excluded from display set and optionally logged for diagnostics.

## Persistence and Indexing Notes
- No new tables/indexes are required for MVP.
- Existing query efficiency relies on current set/history query paths and date-bound filtering.
