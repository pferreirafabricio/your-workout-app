# Implementation Plan: Nutrition Tracking

**Branch**: `003-nutrition-tracking` | **Date**: 2026-03-28 | **Spec**: `/specs/003-nutrition-tracking/spec.md`
**Input**: Feature specification from `/specs/003-nutrition-tracking/spec.md`

## Summary

Add a Nutrition Tracking module that supports fast manual food logging, real-time daily macro/calorie summaries, surplus/deficit guidance when goals are configured, and historical nutrition trends correlated with body weight. Implementation will follow existing TanStack Start layering: typed validation and business logic in `src/lib/features`, route-level orchestration in `src/routes`, React Query for data fetching/invalidation, and Prisma for persistent nutrition entities and aggregates.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode), React 19, TanStack Start 1.139  
**Primary Dependencies**: TanStack Router/Query, Prisma 7, Zod 4, Better Bookkeeping UI, Tailwind CSS v4  
**Storage**: PostgreSQL with Prisma schema/migrations  
**Testing**: Vitest + React Testing Library + Playwright  
**Target Platform**: SSR web app for desktop and mobile browsers  
**Project Type**: Full-stack web application (single-repo TanStack Start)  
**Performance Goals**: Daily summary updates visible within 1 second after food-entry mutations (SC-002); food-entry flow typically completable in <=10 seconds (SC-001)  
**Constraints**: Preserve strict layer boundaries, UTC storage with local-day bucketing, auth+CSRF middleware on mutations, no weekly averages in MVP, deterministic conflict handling (last-write-wins)  
**Scale/Scope**: One new nutrition route slice, new nutrition domain server module(s), Prisma model/migration updates, query/mutation wiring, and layered tests for nutrition logging + history/correlation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- DRY/KISS/SOLID: PASS. Nutrition calculations and conflict rules will be centralized in domain services/utilities, not duplicated across route components.
- Layer boundaries: PASS. Routes will orchestrate query/mutation and local UI state only; validation and persistence remain in `src/lib/features`.
- Data/security impact: PASS. Prisma schema changes are explicit, server-side validation remains mandatory, and mutation middleware protections are retained.
- Test strategy: PASS. Unit, integration, and e2e tests are planned for logging, summary behavior, and history/correlation journeys.
- TanStack Router integration tests: PASS. Route loader/query and invalidation behavior will be covered using existing integration-test patterns.

### Post-Design Gate

- DRY/KISS/SOLID: PASS. Design artifacts define shared calculation primitives for macro calories, balance, and daily aggregation.
- Layer boundaries: PASS. Interface contracts keep domain rules in server/lib and keep route files orchestration-only.
- Data/security impact: PASS. Data model and contracts include validation, timestamp/day-boundary handling, and safe mutation semantics.
- Test strategy: PASS. Coverage responsibilities are mapped across unit, integration, and e2e layers for each critical user story.
- TanStack Router integration tests: PASS. Design includes route data prefetch and refresh behavior checks for nutrition screens.

## Project Structure

### Documentation (this feature)

```text
specs/003-nutrition-tracking/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── nutrition-tracking-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma
└── migrations/

src/
├── lib/
│   ├── features/
│   │   ├── workouts/
│   │   └── nutrition/                     # new
│   └── shared/
├── routes/
│   └── __index/
│       ├── _layout.tsx                   # nav entry update
│       ├── _layout.current-workout/
│       ├── _layout.workout-history/
│       └── _layout.nutrition/            # new
└── components/
    └── ui/

e2e/
└── nutrition.spec.ts                     # new
```

**Structure Decision**: Reuse the existing single-project TanStack Start architecture. Add one nutrition feature module and one route slice, while integrating with existing body weight and navigation flows.

## Complexity Tracking

No constitution violations require exceptions.
