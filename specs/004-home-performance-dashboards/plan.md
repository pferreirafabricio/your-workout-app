# Implementation Plan: Home Performance Dashboards

**Branch**: `004-home-performance-dashboards` | **Date**: 2026-03-28 | **Spec**: `/specs/004-home-performance-dashboards/spec.md`
**Input**: Feature specification from `/specs/004-home-performance-dashboards/spec.md`

## Summary

Deliver the home dashboard chart experience for movement and nutrition trends by building on the existing Recharts implementation in `src/routes/__index/_layout.index.tsx`, while closing remaining gaps around metric clarity, session-stable filter state, empty-state behavior, date-range handling, and layered test coverage. Server-side aggregation remains in existing feature modules (`workouts.server` and `nutrition.server`) and route code stays orchestration-only.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode), React 19, TanStack Start 1.139  
**Primary Dependencies**: TanStack Router/Query, Prisma 7, Zod 4, Recharts 3, Better Bookkeeping UI, Tailwind CSS v4  
**Storage**: PostgreSQL via Prisma (no new persistence required for MVP; derived chart series only)  
**Testing**: Vitest + React Testing Library + Playwright  
**Target Platform**: SSR web app for desktop and mobile browsers  
**Project Type**: Full-stack web application (single-repo TanStack Start)  
**Performance Goals**: Movement/nutrition chart rendering under 3s for users with >=30 days data (SC-001); near-immediate refresh on revisit after data mutations (FR-014)  
**Constraints**: User-scoped data only, route/UI orchestration-only, reuse existing progression/nutrition aggregation contracts, retain Recharts visual baseline, support sparse datasets and clear empty states  
**Scale/Scope**: Enhance one existing home route (`__index/_layout.index.tsx`), tighten server query contracts where needed, and add targeted unit/integration/e2e tests for dashboard interactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- DRY/KISS/SOLID: PASS. Reuse existing server-side aggregation (`buildProgressionSeries`, nutrition history mapping) and avoid duplicate chart transformation logic.
- Layer boundaries: PASS. Computation and validation remain in `src/lib/features/*`; route keeps selectors, query wiring, and rendering.
- Data/security impact: PASS. No new auth model; dashboard queries remain protected by auth middleware and user filtering.
- Test strategy: PASS. Plan includes unit tests for mapping/label rules, integration tests for route query + filter behavior, and Playwright coverage for core chart journeys.
- TanStack Router integration tests: PASS. Route loader/query behavior will follow current TanStack Router testing approach for loader-prefetch and search/filter stability.

### Post-Design Gate

- DRY/KISS/SOLID: PASS. Data model and contracts keep one canonical series shape per chart type and centralized metric metadata mappings.
- Layer boundaries: PASS. Contract keeps chart metric math server-side and presentation concerns in route-level view models.
- Data/security impact: PASS. Design introduces no cross-user exposure paths and preserves existing middleware-enforced access control.
- Test strategy: PASS. Artifacts map every P1/P2 scenario to unit + integration + e2e coverage.
- TanStack Router integration tests: PASS. Search/date/filter state behavior is covered in integration test scope where route behavior changes.

## Project Structure

### Documentation (this feature)

```text
specs/004-home-performance-dashboards/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── home-performance-dashboard-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── routes/
│   └── __index/
│       ├── _layout.index.tsx                # existing dashboard charts; primary enhancement target
│       └── _layout.tsx                      # nav/shell context (if dashboard state plumbing is needed)
├── lib/
│   ├── features/
│   │   ├── workouts/
│   │   │   ├── workouts.server.ts           # progression series source
│   │   │   └── workout-progression.ts       # progression input contracts
│   │   └── nutrition/
│   │       ├── nutrition.server.ts          # nutrition history/defaults source
│   │       └── nutrition.domain.ts          # daily/nutrition date utilities
│   └── shared/
│       └── utils.ts                         # formatting helpers used by chart tooltips/axes
└── components/
    └── ui/

e2e/
└── workouts.spec.ts | nutrition.spec.ts     # existing suites to extend with dashboard assertions
```

**Structure Decision**: Keep the current single-project TanStack Start architecture and enhance existing route/server modules rather than introducing new dashboard-specific persistence layers or services.

## Complexity Tracking

No constitution violations require exceptions.
