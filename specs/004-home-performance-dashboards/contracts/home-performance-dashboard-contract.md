# Home Performance Dashboard Interface Contract (MVP)

## Scope
Defines route-to-server and server-to-client interfaces used by the home dashboard movement and nutrition charts.

## 1. Movement Progression Series Contract

### Operation
`getProgressionSeriesServerFn`

### Input
```ts
{
  movementId: string;
  metric: "maxWeight" | "totalReps" | "totalVolume";
  startDate?: string; // ISO/date-compatible input
  endDate?: string;   // ISO/date-compatible input
}
```

### Output
```ts
Array<{
  date: string;  // YYYY-MM-DD after timezone normalization
  value: number;
}>
```

### Behavior rules
- Data is authenticated and user-scoped.
- Aggregation is by calendar day in user timezone.
- Returned points are chronological.
- Empty array is valid and maps to dashboard empty state.

## 2. Nutrition History Contract

### Operation
`getNutritionHistoryServerFn`

### Input
```ts
{
  startDate: string; // YYYY-MM-DD local date
  endDate: string;   // YYYY-MM-DD local date
  includeBodyWeight?: boolean;
}
```

### Output
```ts
{
  points: Array<{
    localDate: string;
    caloriesCanonical: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    bodyWeight: number | null;
  }>;
}
```

### Behavior rules
- Missing bodyweight values are represented as `null` and must not fail the query.
- Date range is inclusive and user-scoped.
- Output supports dashboard metric switching without server contract changes.

## 3. Dashboard Date Defaults Contract

### Operation
`getNutritionDefaultsServerFn`

### Output (dashboard-relevant)
```ts
{
  historyRange: {
    startDate: string;
    endDate: string;
  };
}
```

### Behavior rules
- Provides initial dashboard date range defaults.
- Route loader should prefetch movement list and nutrition history for this range.

## 4. Route-Level Query Contract

### Query keys
- `dashboard-progression-series:{movementId}:{metric}:{startDate}:{endDate}`
- `dashboard-nutrition-history:{startDate}:{endDate}`
- `movements`
- `nutrition-defaults`

### Loader/prefetch expectations
Home dashboard loader prefetches:
1. nutrition defaults
2. movement list
3. initial nutrition history for default range

### Invalidations/refresh expectations
- Dashboard reads should reflect newly logged workouts/nutrition data when revisited or refreshed in-session.
- Any mutation flow that returns to dashboard should invalidate or refetch relevant dashboard query keys.

## 5. UI Preference Contract (Session)

### State shape
```ts
{
  selectedMovementId: string;
  movementMetric: "maxWeight" | "totalReps" | "totalVolume";
  nutritionMetric: "calories" | "protein" | "carbs" | "fats" | "bodyWeight";
  startDate: string;
  endDate: string;
}
```

### Guarantees
- Selections remain stable for the active session/navigation flow.
- Date controls enforce valid ranges before executing dependent queries.
- Labels/tooltips include explicit metric/unit names for all selections.

## 6. Validation and Security Contract

### Validation
- Movement metric and nutrition metric values must be from explicit enums.
- Date inputs must parse as valid dates and maintain `startDate <= endDate`.
- Missing movement IDs result in disabled query or empty state, not unhandled failure.

### Security
- Server functions are protected by authentication middleware.
- Returned datasets are constrained to the signed-in user.
- No sensitive data beyond dashboard chart requirements is returned.
