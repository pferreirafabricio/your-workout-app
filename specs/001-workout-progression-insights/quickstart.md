# Quickstart: Workout Progression Insights

## Goal
Implement and verify the workout progression feature set under Bun runtime with strict TypeScript, Tailwind CSS v4 UI updates, and constitution-required test layering.

## Prerequisites
- Bun installed
- PostgreSQL available (local docker flow supported)
- Environment variables configured for database and app runtime

## 1. Install and generate
```bash
bun install
bun run generate
```

## 2. Apply Prisma schema changes
```bash
bun run db:migrate
```

## 3. Run type safety gate
```bash
bun run typecheck
```

## 4. Start app
```bash
bun run dev
```

## 5. Implement in vertical slices
1. Security baseline: password hashing + lockout + CSRF/session hardening.
2. Movement lifecycle: type metadata + muscle-group enum + equipment catalog integration + archive behavior.
3. Bodyweight and preferences: bodyweight entries + kg/lbs preference + conversions.
4. Set/workout enrichment: timestamps, notes/RPE, snapshot semantics, conflict notice.
5. Rest timer + progression queries/charts.

## 6. Validate behavior

### Unit and integration
```bash
bun run typecheck
bun test
```

### End-to-end critical paths
```bash
bun run test
```

## 7. Manual verification checklist
- Create/edit/archive movement; archived movement excluded from new set picker.
- Equipment catalog is preloaded and selectable; invalid equipment or muscle-group values are blocked in UI and rejected by backend.
- Create workout, add/edit/delete sets, complete workout, verify totals and duration.
- Bodyweight movement defaults to latest body weight and persists snapshot value.
- Switch unit preference (kg/lbs) and confirm consistent input/display/history conversion.
- Rest timer starts on set completion and resets on next set; target threshold indication appears.
- Progression chart shows max weight/total reps/total volume by movement over time.
- Sign-in lockout triggers after 5 failed attempts in 15 minutes and expires after 15 minutes.

## 8. Performance checks
- Confirm no route-level regressions for current workout/history/progression data loads.
- Validate history/progression responses remain within target for representative datasets.

## 9. Definition of done
- All constitution gates satisfied.
- Unit + integration + e2e tests pass in CI.
- No plaintext password paths remain.
- Frontend and backend validations are both implemented for all mutation flows.
- TypeScript strict mode passes without suppressions.
