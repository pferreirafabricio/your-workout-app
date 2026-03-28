# Quickstart: Nutrition Tracking

## Goal
Implement Nutrition Tracking MVP with manual food logging, real-time daily summary, goal-aware balance indicators, and historical nutrition/body-weight correlation.

## Prerequisites
- Bun installed
- Postgres running (local Docker or configured DB)
- Environment variables configured for app/database

## 1. Baseline checks
```bash
bun install
bun run generate
bun run typecheck
```

## 2. Implement nutrition backend domain
1. Add nutrition feature module under `src/lib/features/nutrition/`.
2. Add server functions for:
   - get/create daily log by selected local date
   - create/update/delete food entry
   - upsert nutrition goals
   - fetch nutrition history range with optional body-weight overlay
3. Apply existing mutation middleware patterns (auth + CSRF).
4. Keep calorie canonicalization and balance math in shared domain utilities.

## 3. Add schema and validation
1. Update `prisma/schema.prisma` with nutrition entities and relationships.
2. Generate and apply migration:
```bash
bun run db:migrate
```
3. Add Zod schemas for all nutrition mutation/query inputs and reuse in client submission boundaries.

## 4. Build route and UI
1. Add route slice `src/routes/__index/_layout.nutrition/`.
2. Add query options + route loader prefetch for selected date and history ranges.
3. Build page capabilities:
   - fast manual food-entry form
   - inline entry edit/delete
   - summary cards for calories and macros
   - goal setup prompt when goals are missing
   - surplus/deficit and remaining calories when goals exist
   - mismatch warning for entered vs canonical calories
   - history chart with optional body-weight overlay
4. Add navigation entry from `src/routes/__index/_layout.tsx`.

## 5. Keep behavior aligned with clarified rules
1. Canonical calories are macro-derived; entered calories remain editable/displayed.
2. Goal-dependent fields are hidden until goals are configured.
3. Day grouping uses local date boundaries with UTC storage.
4. Concurrent edits use last-write-wins and trigger non-blocking conflict notice.
5. Weekly averages remain out of MVP.

## 6. Validate with tests

### Unit and integration
```bash
bun test src/lib --run
bun test src/routes --run
```

### End-to-end
```bash
bun run test -- e2e/nutrition.spec.ts
```

## 7. Manual verification checklist
- Log a food entry in under 10 seconds and verify immediate totals update.
- Edit and delete entries inline; totals remain correct.
- Enter calories that differ from macro-derived calories and confirm warning + canonical balance behavior.
- Verify no-goal state hides remaining/surplus-deficit and shows setup prompt.
- Configure goals and verify remaining calories + surplus/deficit labels update in real time.
- Add entries near local midnight and confirm day attribution is correct.
- Open history and verify nutrition trends and optional body-weight alignment.
- Simulate concurrent edits to same entry and verify last-write-wins + non-blocking conflict notice.

## 8. Definition of done
- Plan/design artifacts complete and constitution gates pass.
- Prisma migration generated and schema validated.
- Typecheck and tests pass for changed areas.
- Nutrition route is accessible from app navigation and works on desktop/mobile widths.
- No layer-boundary violations (business rules in lib/server, route UI orchestration only).

## 9. Verification Log (2026-03-28)
- `bun run db:migrate`: passed; created and applied migration `20260328200543_nutrition`.
- `bun run generate`: passed; Prisma client regenerated.
- `bunx @tanstack/router-cli generate`: passed; route tree regenerated.
- `bun run typecheck`: passed.
- `bunx vitest run src/lib/features/nutrition/nutrition.domain.test.ts src/lib/features/nutrition/nutrition.server.test.ts`: tests passed; Vitest reported a hanging-process shutdown warning after completion.
- `bun run test e2e/nutrition.spec.ts`: failed in shared auth helper setup (`Logged in as` visibility assertion), blocking nutrition e2e validation in this environment.
