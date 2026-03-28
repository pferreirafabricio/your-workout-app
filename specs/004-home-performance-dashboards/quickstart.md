# Quickstart: Home Performance Dashboards

## Goal
Complete and harden the home dashboard movement and nutrition chart experience using the existing Recharts implementation, while meeting feature 004 requirements and layered testing gates.

## Prerequisites
- Bun installed
- Postgres available (local Docker or configured database)
- Environment variables set for app and DB

## 1. Baseline checks
```bash
bun install
bun run generate
bun run typecheck
```

## 2. Implement dashboard enhancements in existing route
1. Update `src/routes/__index/_layout.index.tsx`:
- keep current Recharts `AreaChart` layout/styling baseline,
- ensure movement metric selector supports exactly `maxWeight`, `totalReps`, `totalVolume`,
- ensure nutrition metric selector supports at least `calories`, `protein`, `bodyWeight` (plus existing carbs/fats if retained),
- enforce date-range validation and stable selector behavior,
- improve titles/axis/tooltips/latest-value labels to always show clear metric+unit context,
- preserve explicit empty-state messaging for both charts.

2. Keep query orchestration in route only:
- movement series from `getProgressionSeriesServerFn`,
- nutrition series from `getNutritionHistoryServerFn`,
- defaults from `getNutritionDefaultsServerFn`.

3. Keep business calculations in server/lib layers:
- do not duplicate progression aggregation logic in route,
- do not move nutrition aggregation formulas to client code.

## 3. Optional server-side tightening (only if required by acceptance tests)
1. Update validation or output shaping in:
- `src/lib/features/workouts/workout-progression.ts`
- `src/lib/features/workouts/workouts.server.ts`
- `src/lib/features/nutrition/nutrition.server.ts`
2. Preserve auth middleware and strict user scoping.

## 4. Testing implementation

### Unit tests
- Add tests for metric label/unit mapping and chart point transformation helpers.
- Validate movement metric formula expectations against known fixtures.

### Integration tests
- Add route-level tests for:
  - date range and selector state transitions,
  - query-driven render states (loading, populated, empty),
  - same-session state restoration behavior.

### End-to-end tests
- Extend dashboard coverage in Playwright to verify:
  - movement selection + metric switching updates chart,
  - nutrition metric switching updates chart,
  - empty states appear for no-data ranges,
  - labels/tooltips communicate metric and unit.

## 5. Run verification commands
```bash
bun run typecheck
bunx vitest run src/lib/features/workouts src/lib/features/nutrition src/routes
bun run test -- e2e/workouts.spec.ts e2e/nutrition.spec.ts
```

## 6. Manual verification checklist
- Select any movement and confirm max weight chart point values align with logged sets by day.
- Switch to total reps and total volume and confirm value changes and unit labels update correctly.
- Change date range and confirm both movement and nutrition charts re-query and rerender.
- Confirm sparse or no-data ranges show helpful empty states without runtime errors.
- Refresh/revisit dashboard and confirm same-session filter behavior remains understandable.
- Verify charts render clearly on mobile and desktop widths.

### Functional Requirement Verification (FR-001 to FR-014)
- [ ] FR-001 Home dashboard shows movement performance chart module with movement + metric controls.
- [ ] FR-002 Movement metric selector supports exactly maxWeight, totalReps, totalVolume.
- [ ] FR-003 Movement chart values are aggregated by day for selected movement.
- [ ] FR-004 Maximum weight equals highest set weight per selected day.
- [ ] FR-005 Total reps equals sum of reps across selected movement sets per day.
- [ ] FR-006 Total volume equals sum of reps * weight across selected movement sets per day.
- [ ] FR-007 Movement chart plots chronological daily points and readable tooltips.
- [ ] FR-008 Home dashboard includes nutrition trend charting with metric selector.
- [ ] FR-009 Nutrition selector supports at least calories, protein, bodyweight.
- [ ] FR-010 Both movement and nutrition charts support date-range filtering.
- [ ] FR-011 Both charts show non-error empty states when no data exists.
- [ ] FR-012 Chart labels and tooltips clearly identify metric and unit.
- [ ] FR-013 Dashboard data is scoped to the signed-in user only.
- [ ] FR-014 Dashboard reflects fresh data after logging workouts/nutrition and revisiting/refreshing.

## 7. Definition of done
- Plan/research/design artifacts completed for feature 004.
- Dashboard route behavior satisfies FR-001 through FR-014 scope.
- Constitution test gate met with unit + integration + e2e coverage.
- No layer-boundary regressions: server/lib owns business logic, route owns orchestration/UI.
