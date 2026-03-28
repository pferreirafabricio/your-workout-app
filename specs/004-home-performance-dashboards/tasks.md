# Tasks: Home Performance Dashboards

**Input**: Design documents from /specs/004-home-performance-dashboards/
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/home-performance-dashboard-contract.md, quickstart.md

**Tests**: Unit, integration, and e2e tests are required for each user story.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align dependencies, test entry points, and feature docs for dashboard work.

- [ ] T001 Confirm Recharts dependency and lockfile integrity in package.json and bun.lock
- [ ] T002 [P] Add dashboard route test scaffold in src/routes/__index/_layout.index.test.tsx
- [ ] T003 [P] Add dashboard Playwright helpers for chart selectors and tooltips in e2e/helpers/dashboard.ts
- [ ] T004 Add dashboard verification checklist section for FR-001 through FR-014 in specs/004-home-performance-dashboards/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared dashboard primitives and query orchestration needed by all stories.

**CRITICAL**: Complete this phase before starting user story phases.

- [ ] T005 Create movement and nutrition metric metadata map with units in src/routes/__index/-dashboard/metrics.ts
- [ ] T006 [P] Create movement and nutrition chart point mappers in src/routes/__index/-dashboard/series-mappers.ts
- [ ] T007 [P] Create date-range normalization and validation helpers in src/routes/__index/-dashboard/date-range.ts
- [ ] T008 Create home dashboard query options module in src/routes/__index/-dashboard/queries.ts
- [ ] T009 Refactor home dashboard route to consume shared dashboard helpers in src/routes/__index/_layout.index.tsx
- [ ] T010 Add foundational unit tests for shared helpers in src/routes/__index/-dashboard/metrics.test.ts
- [ ] T011 [P] Add foundational unit tests for mapper/date-range helpers in src/routes/__index/-dashboard/series-mappers.test.ts

**Checkpoint**: Shared dashboard foundation complete and stable.

---

## Phase 3: User Story 1 - Track Movement Progress Over Time (Priority: P1) 🎯 MVP

**Goal**: User selects a movement and movement metric (maximum weight, total reps, total volume) and sees a correct trend chart over time.

**Independent Test**: From home dashboard, select a movement and switch movement metrics; verify plotted points and labels match workout history for selected date range.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add unit tests for movement metric label and unit rendering in src/routes/__index/-dashboard/metrics.test.ts
- [ ] T013 [P] [US1] Add unit tests for movement series ordering and value mapping in src/routes/__index/-dashboard/series-mappers.test.ts
- [ ] T014 [US1] Add integration test for movement selector and metric switching behavior in src/routes/__index/_layout.index.test.tsx
- [ ] T015 [US1] Extend progression metric formula tests for maxWeight/totalReps/totalVolume in src/lib/features/workouts/workout-progression.test.ts
- [ ] T016 [US1] Add e2e test for movement chart metric switching and tooltip updates in e2e/workouts.spec.ts

### Implementation for User Story 1

- [ ] T017 [US1] Enforce movement metric options and selector wiring in src/routes/__index/_layout.index.tsx
- [ ] T018 [US1] Wire movement chart series query to date-range state in src/routes/__index/_layout.index.tsx
- [ ] T019 [US1] Add movement chart title, axis, and tooltip unit clarity in src/routes/__index/_layout.index.tsx
- [ ] T020 [US1] Implement movement chart empty-state and no-movement fallback behavior in src/routes/__index/_layout.index.tsx
- [ ] T021 [US1] Tune movement chart gradient styling and responsive behavior in src/routes/__index/_layout.index.tsx

**Checkpoint**: MVP complete and independently testable.

---

## Phase 4: User Story 2 - Compare Nutrition Trends On Home Dashboard (Priority: P2)

**Goal**: User switches nutrition metrics and sees nutrition/bodyweight trends over time on home dashboard.

**Independent Test**: Switch nutrition metric and date range; verify chart values, null handling, labels, and empty-state behavior.

### Tests for User Story 2

- [ ] T022 [P] [US2] Add unit tests for nutrition metric mapping and bodyweight null filtering in src/routes/__index/-dashboard/series-mappers.test.ts
- [ ] T023 [US2] Add integration test for nutrition metric selector and query state transitions in src/routes/__index/_layout.index.test.tsx
- [ ] T024 [US2] Add server contract test for nutrition history includeBodyWeight behavior in src/lib/features/nutrition/nutrition.server.test.ts
- [ ] T025 [US2] Add e2e test for nutrition metric switching and empty-state behavior in e2e/nutrition.spec.ts

### Implementation for User Story 2

- [ ] T026 [US2] Enforce nutrition metric options including calories/protein/bodyweight in src/routes/__index/_layout.index.tsx
- [ ] T027 [US2] Wire nutrition chart query to defaults and date-range state in src/routes/__index/_layout.index.tsx
- [ ] T028 [US2] Add nutrition chart title, axis, and tooltip unit clarity in src/routes/__index/_layout.index.tsx
- [ ] T029 [US2] Implement sparse-data and no-data handling for nutrition chart in src/routes/__index/_layout.index.tsx
- [ ] T030 [US2] Tune nutrition chart gradient styling and responsive behavior in src/routes/__index/_layout.index.tsx

**Checkpoint**: US1 and US2 independently functional and verifiable.

---

## Phase 5: User Story 3 - Keep Dashboard Interactions Understandable (Priority: P3)

**Goal**: Users retain clear chart context with stable same-session filters, valid date ranges, and explicit metric-unit labeling.

**Independent Test**: Change filters, navigate away and back in-session, then confirm state restoration, valid ranges, and clear labels.

### Tests for User Story 3

- [ ] T031 [P] [US3] Add unit tests for date-range guard and fallback normalization in src/routes/__index/-dashboard/date-range.test.ts
- [ ] T032 [US3] Add integration test for same-session filter persistence in src/routes/__index/_layout.index.test.tsx
- [ ] T033 [US3] Add integration test for invalid date-range query suppression behavior in src/routes/__index/_layout.index.test.tsx
- [ ] T034 [US3] Add e2e test for filter persistence and label clarity across navigation in e2e/workouts.spec.ts

### Implementation for User Story 3

- [ ] T035 [US3] Add search-backed preference state for movement metric, nutrition metric, and date range in src/routes/__index/_layout.index.tsx
- [ ] T036 [US3] Apply date-range validation before issuing dashboard queries in src/routes/__index/_layout.index.tsx
- [ ] T037 [US3] Ensure latest-value cards and chart subtitles always include metric and unit in src/routes/__index/_layout.index.tsx

**Checkpoint**: All user stories independently testable and behaviorally complete.

---

## Phase 6: Security, Freshness, and Performance Validation

**Purpose**: Close cross-story requirements for user-scoped data, in-session freshness, and measurable rendering performance.

- [ ] T038 [P] Add auth-scope integration tests for movement and nutrition dashboard queries in src/routes/__index/_layout.index.test.tsx
- [ ] T039 [P] Add server-level user-scope regression tests for progression and nutrition history in src/lib/features/workouts/workouts.server.test.ts
- [ ] T040 Add dashboard query invalidation/refetch behavior for revisit-after-mutation flows in src/routes/__index/_layout.index.tsx
- [ ] T041 Add integration test proving dashboard freshness after workout/nutrition mutations in src/routes/__index/_layout.index.test.tsx
- [ ] T042 Add e2e scenario verifying refreshed movement and nutrition charts after logging new data in e2e/workouts.spec.ts
- [ ] T043 Add repeatable chart render timing check and acceptance threshold documentation for SC-001 in specs/004-home-performance-dashboards/quickstart.md

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation sync, and release readiness.

- [ ] T044 [P] Run typecheck and targeted Vitest suites in package.json
- [ ] T045 [P] Run targeted Playwright dashboard suites in e2e/workouts.spec.ts and e2e/nutrition.spec.ts
- [ ] T046 Update quickstart execution evidence and pass/fail results in specs/004-home-performance-dashboards/quickstart.md
- [ ] T047 Correct plan path reference to shared utils directory in specs/004-home-performance-dashboards/plan.md
- [ ] T048 Record final acceptance evidence for FR and SC coverage in specs/004-home-performance-dashboards/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1: No dependencies.
- Phase 2: Depends on Phase 1 and blocks all user stories.
- Phase 3 (US1): Depends on Phase 2.
- Phase 4 (US2): Depends on Phase 2.
- Phase 5 (US3): Depends on Phase 2 and integrates stabilized behavior from US1/US2.
- Phase 6: Depends on completion of US1 through US3.
- Phase 7: Depends on completion of Phase 6.

### User Story Dependencies

- US1 (P1): Independent after foundational phase.
- US2 (P2): Independent after foundational phase.
- US3 (P3): Depends on baseline selectors and chart rendering from US1 and US2.

### Within-Story Ordering

- Tests first where feasible.
- Helper/model work before route integration.
- Integration and e2e after implementation tasks complete.

## Parallel Opportunities

- Phase 1: T002 and T003
- Phase 2: T006 and T007
- US1: T012 and T013
- US2: T022 and T024
- US3: T031 and T032
- Phase 6: T038 and T039
- Phase 7: T044 and T045

## Parallel Example: User Story 1

- Run T012 and T013 in parallel while preparing movement fixtures.
- Run T014 after helper APIs stabilize.

## Parallel Example: User Story 2

- Run T022 and T024 in parallel because they touch different layers.
- Run T025 after T026 through T029 land.

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks in Phase 3.
3. Validate US1 independently and release MVP.

### Incremental Delivery

1. Deliver US1 (movement progression).
2. Deliver US2 (nutrition trends).
3. Deliver US3 (clarity and persistence).
4. Complete Phase 6 validation gates.
5. Finish Phase 7 polish and evidence capture.
