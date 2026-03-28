# Implementation Plan: Workout Progression Insights

**Branch**: `001-workout-progression-insights` | **Date**: 2026-03-28 | **Spec**: `/specs/001-workout-progression-insights/spec.md`
**Input**: Feature specification from `/specs/001-workout-progression-insights/spec.md`

## Summary

Expand the existing workout logger into a progression-focused system by adding movement lifecycle controls (archive), richer set and workout capture (timestamps, notes, optional RPE), bodyweight-aware defaults with immutable set snapshots, user unit preferences with consistent conversions, rest-time feedback, progression history metrics, and baseline auth hardening (hashed passwords, lockout policy, CSRF/session protections). The data model includes muscle-group enums and a prepopulated equipment catalog table referenced by movements. Implementation will use TanStack Start route/server-function boundaries, Prisma/PostgreSQL schema evolution, strict TypeScript typing, and layered tests (unit + route/data integration + Playwright critical flows).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) on React 19 + TanStack Start 1.139  
**Primary Dependencies**: TanStack Start/Router/Query/Form, Prisma 7, Zod 4, Tailwind CSS v4, Playwright 1.57  
**Storage**: PostgreSQL via Prisma ORM (schema + migrations as source of truth)  
**Testing**: Vitest + React Testing Library for unit/integration, Playwright for e2e critical journeys  
**Target Platform**: Web application (SSR/SPA hybrid) for modern desktop/mobile browsers  
**Project Type**: Full-stack web app (single repo, route-centric frontend + server functions)  
**Performance Goals**: Core logging interactions <200ms perceived response; progression/history views load <=2s for up to 1 year of user data  
**Constraints**: Must run on Bun runtime; must preserve TanStack route correctness and performance; TypeScript strictness cannot regress; use Tailwind CSS v4 styling conventions  
**Scale/Scope**: Single-user fitness tracking workflows, weekly active usage, historical dataset growth to at least daily workouts for 12 months per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- DRY/KISS/SOLID: PASS. Shared metric and conversion logic will be centralized in `src/lib/` utilities instead of duplicated across route files.
- Layered boundaries: PASS. Business rules remain in server functions and lib modules; routes/components orchestrate only.
- Data/security impact: PASS with required updates. Prisma schema changes are required for archived movements, muscle-group enum, equipment catalog seeding, set metadata, bodyweight entries, preferences, lockout, and secure password storage.
- Test strategy: PASS. Plan includes unit tests (metrics/conversions/security helpers), integration tests (route/data boundaries), and Playwright coverage for movement/set/workout CRUD, bodyweight defaults, and rest timing.
- TanStack Router integration testing: PASS. Route behavior changes (history filters/progression views) will use integration tests aligned with official TanStack Router testing guidance.

### Post-Design Gate

- DRY/KISS/SOLID: PASS. Data model and contracts isolate reusable concerns (metrics, rest timer state rules, auth lockout policy).
- Layered boundaries: PASS. Contracts and quickstart enforce frontend and backend validation with typed route/query boundaries.
- Data/security impact: PASS. Design includes credential hashing migration path, lockout entity/state, and validation contracts.
- Test strategy: PASS. Design artifacts map each high-risk behavior to unit, integration, and e2e verification.
- TanStack Router integration testing: PASS. Route-level test strategy is explicitly documented in quickstart/contract scope.

## Project Structure

### Documentation (this feature)

```text
specs/001-workout-progression-insights/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── workout-progression-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma

src/
├── components/
│   └── ui/
├── hooks/
├── lib/
│   ├── auth.server.ts
│   ├── movements.server.ts
│   ├── workouts.server.ts
│   └── utils.ts
├── routes/
│   ├── __index/
│   │   ├── _layout.current-workout/
│   │   ├── _layout.movements/
│   │   └── _layout.workout-history/
│   ├── sign-in.tsx
│   └── create-account.tsx
└── integrations/
    └── tanstack-query/

e2e/
├── movements.spec.ts
├── sets.spec.ts
└── workouts.spec.ts
```

**Structure Decision**: Use the existing single-project TanStack Start structure with incremental schema/server-function/route updates. No new top-level apps/packages are introduced.

## Complexity Tracking

No constitution violations requiring exceptions are expected.

## Task Generation Notes

- Every mutation-related task in `tasks.md` MUST include both frontend validation and backend validation updates, with matching rules and error messages.
- Tasks for movement management MUST include muscle-group enum handling and equipment catalog integration.
- Tasks for database work MUST include equipment catalog prepopulation via migration/seed strategy.
