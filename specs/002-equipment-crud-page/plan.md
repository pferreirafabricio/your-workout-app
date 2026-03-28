# Implementation Plan: Equipment CRUD Management Page

**Branch**: `002-equipment-crud-page` | **Date**: 2026-03-28 | **Spec**: `/specs/002-equipment-crud-page/spec.md`
**Input**: Feature specification from `/specs/002-equipment-crud-page/spec.md`

## Summary

Create a dedicated Equipment management page that supports create, read, update, archive, and restore operations for the existing `Equipment` entity, while preserving movement references and active-only equipment filtering in movement forms. Implementation follows existing TanStack Start patterns: server functions in `src/lib`, route orchestration in `src/routes`, shared Zod validation, React Query cache invalidation, and layered tests (unit, integration, e2e).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) with React 19 + TanStack Start 1.139  
**Primary Dependencies**: TanStack Router/Query, Prisma 7, Zod 4, Better Bookkeeping UI, Tailwind CSS v4, Lucide icons  
**Storage**: PostgreSQL with Prisma schema/migrations  
**Testing**: Vitest + React Testing Library + Playwright  
**Target Platform**: SSR web app for desktop and mobile browsers  
**Project Type**: Full-stack web application (single-repo TanStack Start)  
**Performance Goals**: Equipment page initial render <= 2s for up to 500 catalog records  
**Constraints**: Preserve strict layer boundaries, preserve movement reference integrity, keep TypeScript strictness, use existing auth+CSRF middleware on mutations  
**Scale/Scope**: Single application page and supporting server/query/validation/test updates for Equipment CRUD

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- DRY/KISS/SOLID: PASS. Equipment logic will be consolidated in a dedicated server module rather than route-level Prisma calls.
- Layer boundaries: PASS. Route components orchestrate UI state; business logic/validation remains in lib/server layers.
- Data/security impact: PASS. Existing schema supports lifecycle toggle with `isActive`; auth and CSRF protections will remain mandatory for mutations.
- Test strategy: PASS. Unit, integration, and e2e coverage is explicitly planned for create/edit/archive/restore paths.
- TanStack Router integration tests: PASS. Route loader/query wiring will be covered with integration tests aligned to official guidance.

### Post-Design Gate

- DRY/KISS/SOLID: PASS. Contracts and data model isolate equipment concerns and avoid duplication with movement domain logic.
- Layer boundaries: PASS. Interface contracts define route/query and mutation boundaries clearly.
- Data/security impact: PASS. Design preserves uniqueness constraints, reference integrity, and mutation middleware protections.
- Test strategy: PASS. Design artifacts define verification for each critical path and error condition.
- TanStack Router integration tests: PASS. Design includes loader prefetch and query invalidation checks at integration level.

## Project Structure

### Documentation (this feature)

```text
specs/002-equipment-crud-page/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── equipment-crud-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma

src/
├── lib/
│   ├── movements.server.ts
│   ├── equipment.server.ts           # new
│   └── validation/
│       └── workout-progression.ts
├── routes/
│   └── __index/
│       ├── _layout.movements/
│       └── _layout.equipment/        # new
└── components/
    └── ui/

e2e/
├── movements.spec.ts
└── equipment.spec.ts                 # new
```

**Structure Decision**: Keep the existing single-project TanStack Start structure and add one new route slice plus one domain server module for equipment CRUD. Reuse existing UI components and query patterns.

## Complexity Tracking

No constitution violations require exceptions.
