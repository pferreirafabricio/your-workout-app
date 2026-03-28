# Nutrition Tracking Interface Contract (MVP)

## Scope
Defines route-to-server and server-to-client contracts for Nutrition Tracking MVP.

## 1. Daily Log Read Contract

### Operation
`getNutritionDailyLogServerFn`

### Input
```ts
{
  date?: string; // YYYY-MM-DD local date; defaults to "today" in user timezone
}
```

### Output
```ts
{
  localDate: string;
  timeZone: string;
  entries: Array<{
    id: string;
    name: string;
    quantity: number;
    quantityUnit: "GRAMS" | "SERVING";
    proteinG: number;
    carbsG: number;
    fatsG: number;
    caloriesEntered: number;
    caloriesCanonical: number;
    hasCalorieMismatch: boolean;
    updatedAt: string; // ISO UTC
  }>;
  totals: {
    proteinG: number;
    carbsG: number;
    fatsG: number;
    caloriesEntered: number;
    caloriesCanonical: number;
    proteinPct: number;
    carbsPct: number;
    fatsPct: number;
  };
  goalContext: {
    hasGoals: boolean;
    calorieTarget?: number;
    proteinTargetG?: number;
    carbsTargetG?: number;
    fatsTargetG?: number;
    goalType?: "CUT" | "MAINTENANCE" | "BULK";
    remainingCalories?: number;
    balanceCalories?: number;
    balanceLabel?: "SURPLUS" | "DEFICIT" | "ON_TARGET";
  };
  notices: Array<{
    code: "CALORIE_MISMATCH" | "CONFLICT_REFRESHED" | "GOALS_REQUIRED";
    message: string;
  }>;
}
```

### Behavior rules
- Always return consumed totals.
- Return goal-dependent fields only when `hasGoals=true`.
- Compute canonical calories from macros for totals and balance.

## 2. Food Entry Mutation Contracts

### Create
`createNutritionFoodEntryServerFn`

Input:
```ts
{
  localDate: string;
  name: string;
  quantity: number;
  quantityUnit: "GRAMS" | "SERVING";
  proteinG: number;
  carbsG: number;
  fatsG: number;
  caloriesEntered: number;
}
```

Output:
```ts
{
  success: boolean;
  entryId?: string;
  notices?: Array<{ code: "CALORIE_MISMATCH"; message: string }>;
  error?: string;
}
```

### Update
`updateNutritionFoodEntryServerFn`

Input:
```ts
{
  entryId: string;
  name?: string;
  quantity?: number;
  quantityUnit?: "GRAMS" | "SERVING";
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
  caloriesEntered?: number;
  updatedAt?: string; // stale client hint for notice generation
}
```

Output:
```ts
{
  success: boolean;
  notices?: Array<{
    code: "CALORIE_MISMATCH" | "CONFLICT_REFRESHED";
    message: string;
  }>;
  error?: string;
}
```

### Delete
`deleteNutritionFoodEntryServerFn`

Input:
```ts
{
  entryId: string;
}
```

Output:
```ts
{
  success: boolean;
  error?: string;
}
```

### Mutation guarantees
- Last-write-wins for concurrent updates on the same entry.
- Any mutation triggers daily total recomputation.
- Mismatch warning surfaced when `caloriesEntered != caloriesCanonical`.

## 3. Goals Contract

### Upsert
`upsertNutritionGoalsServerFn`

Input:
```ts
{
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatsTargetG: number;
  goalType: "CUT" | "MAINTENANCE" | "BULK";
}
```

Output:
```ts
{
  success: boolean;
  goal?: {
    calorieTarget: number;
    proteinTargetG: number;
    carbsTargetG: number;
    fatsTargetG: number;
    goalType: "CUT" | "MAINTENANCE" | "BULK";
  };
  error?: string;
}
```

## 4. History Contract

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
    proteinPct: number;
    carbsPct: number;
    fatsPct: number;
    bodyWeight: number | null;
  }>;
}
```

### Behavior rules
- Daily trends are in MVP scope.
- Weekly averages are excluded from MVP output.
- Missing body-weight rows return `bodyWeight: null` and must not fail query.

## 5. Route and Query Contracts

### Query keys
- `nutrition-daily-log:{localDate}`
- `nutrition-goals`
- `nutrition-history:{startDate}:{endDate}:{includeBodyWeight}`

### Loader contract
Nutrition route loader prefetches:
1. daily log for selected date
2. nutrition goals
3. default history window (if feature panel is visible)

### Invalidation contract
- On create/update/delete entry: invalidate selected-day daily log and any active history range containing that day.
- On goals upsert: invalidate selected-day daily log and goals query.

## 6. Validation and Error Contract

### Validation errors
- Return user-actionable error messages for invalid numeric ranges, empty names, malformed dates, and invalid units.

### Authorization/security
- All mutations require authenticated user context and CSRF protection middleware.
- Reads require authenticated context and are user-scoped.

### Reliability expectations
- Mutation responses are idempotency-safe from UI perspective (re-fetch after completion).
- Conflict notices are non-blocking and accompanied by refreshed totals.
