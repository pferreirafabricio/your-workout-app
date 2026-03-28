# Phase 0 Research: Equipment CRUD Management Page

## Decision 1: Keep Equipment as a global catalog with soft lifecycle state
- Decision: Use existing `Equipment` model and implement archive/restore by toggling `isActive` instead of hard delete.
- Rationale: Existing movement references remain intact, and lifecycle semantics already align with active-only query behavior.
- Alternatives considered:
  - Hard delete equipment rows: rejected because it risks referential breakage and historical data inconsistency.
  - Separate archived table: rejected as unnecessary complexity for current scope.

## Decision 2: Add dedicated server functions for equipment CRUD
- Decision: Implement `createEquipmentServerFn`, `updateEquipmentServerFn`, and `setEquipmentActiveStateServerFn` in `src/lib/equipment.server.ts` with auth + CSRF middleware.
- Rationale: Matches existing server-function architecture used for movement CRUD and keeps route files orchestration-only.
- Alternatives considered:
  - Reuse movement server module for equipment mutations: rejected to avoid mixing unrelated domain logic.
  - Route-level direct Prisma access: rejected due to boundary violations.

## Decision 3: Shared client/server validation via Zod schemas
- Decision: Introduce create/update/archive equipment schemas under `src/lib/validation/workout-progression.ts` (or extracted domain validation module if that file becomes crowded).
- Rationale: Existing pattern already validates mutation inputs symmetrically in client and server layers.
- Alternatives considered:
  - Server-only validation: rejected because immediate UX feedback is required.
  - Client-only validation: rejected due to security and integrity risks.

## Decision 4: Uniqueness conflict handling strategy
- Decision: Keep DB-level uniqueness constraints for `code` and `name` and map Prisma unique errors to explicit user-facing conflict messages.
- Rationale: Database remains single source of truth for race conditions, while UX gets predictable errors.
- Alternatives considered:
  - Pre-check uniqueness only: rejected because it does not prevent concurrent write races.
  - Generic error messages only: rejected due to poor operator experience.

## Decision 5: Routing and query integration pattern
- Decision: Add a dedicated TanStack route at `/__index/_layout/equipment/` with loader prefetch and React Query query options for list retrieval.
- Rationale: Mirrors current folder-based route conventions and query preload style used in movement/workout pages.
- Alternatives considered:
  - Modal-based management inside movements page: rejected because full CRUD workflow and ordering controls need dedicated screen real estate.
  - Static server-rendered list without query caching: rejected because existing app standardizes on TanStack Query.

## Decision 6: Ordering semantics and UI behavior
- Decision: Persist explicit `displayOrder` and render lists sorted by `displayOrder ASC, name ASC`.
- Rationale: Stable deterministic order improves picker and management usability.
- Alternatives considered:
  - Alphabetical-only ordering: rejected because operators need custom ordering.
  - Drag-and-drop ordering for v1: deferred to keep scope minimal.

## Decision 7: Test layering for reliability gate
- Decision: Add unit tests for validation and error mapping, integration tests for server function boundaries, and Playwright coverage for create/edit/archive/restore flows.
- Rationale: Constitution requires test-gated reliability across unit, integration, and e2e.
- Alternatives considered:
  - E2E-only tests: rejected due to poor fault localization and slower feedback.
  - Unit-only tests: rejected due to missing route/data wiring confidence.

## Decision 8: Performance and scope boundaries
- Decision: Keep initial page scope to list + inline create/edit + archive/restore without pagination, while preserving efficient indexed query ordering.
- Rationale: Current expected catalog size is moderate and index already supports active/order filtering.
- Alternatives considered:
  - Add pagination/search immediately: deferred unless catalog growth or profiling indicates need.
  - Build separate admin app: rejected as over-scope for this feature.
