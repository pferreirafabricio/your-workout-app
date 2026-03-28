# Tasks: Nutrition Tracking

**Input**: Design documents from /specs/003-nutrition-tracking/
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/nutrition-tracking-contract.md, quickstart.md

**Tests**: Unit, integration, and e2e tests are required by constitution and spec test coverage notes.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: [ID] [P?] [Story] Description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish nutrition feature scaffolding and shared development baseline.

- [X] T001 Create nutrition feature folder structure in src/lib/features/nutrition/
- [X] T002 [P] Create nutrition route folder and query subfolder in src/routes/__index/_layout.nutrition/ and src/routes/__index/_layout.nutrition/-queries/
- [X] T003 [P] Create nutrition e2e spec scaffold in e2e/nutrition.spec.ts
- [X] T004 [P] Create nutrition server/domain test scaffolds in src/lib/features/nutrition/nutrition.server.test.ts and src/lib/features/nutrition/nutrition.domain.test.ts
- [X] T005 Add nutrition route entry shell in src/routes/__index/_layout.nutrition/index.tsx
- [X] T006 Add nutrition navigation entry in src/routes/__index/_layout.tsx

**Checkpoint**: Nutrition module and route scaffolding are in place and discoverable in app navigation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, validation, and service/query contracts required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Update nutrition data models and enums in prisma/schema.prisma
- [X] T008 Generate Prisma migration for nutrition entities in prisma/migrations/
- [X] T009 [P] Run Prisma client generation updates in prisma/generated/client/
- [X] T010 Implement nutrition input schemas and shared error messages in src/lib/features/nutrition/nutrition.validation.ts
- [X] T011 Implement nutrition domain math/day-boundary helpers in src/lib/features/nutrition/nutrition.domain.ts
- [X] T012 Implement nutrition server read/mutation functions from contract in src/lib/features/nutrition/nutrition.server.ts
- [X] T013 [P] Implement nutrition route query options and keys in src/routes/__index/_layout.nutrition/-queries/nutrition.ts
- [X] T014 Wire nutrition route loader prefetch for daily log/goals/history in src/routes/__index/_layout.nutrition/index.tsx
- [X] T015 Add auth and CSRF enforcement with sanitized error mapping for nutrition mutations in src/lib/features/nutrition/nutrition.server.ts

**Checkpoint**: Foundation is complete and user-story implementation can proceed.

---

## Phase 3: User Story 1 - Log Daily Nutrition Quickly (Priority: P1) 🎯 MVP

**Goal**: Users can add, edit, and delete food entries quickly with immediate daily total updates.

**Independent Test**: Open nutrition page, create multiple entries, edit one inline, delete one, and verify totals recalculate immediately and persist.

### Tests for User Story 1

- [X] T016 [P] [US1] Add unit tests for macro calorie, canonical calorie, and mismatch calculations in src/lib/features/nutrition/nutrition.domain.test.ts
- [ ] T017 [P] [US1] Add integration tests for create/update/delete food entry server functions and total recomputation in src/lib/features/nutrition/nutrition.server.test.ts
- [ ] T018 [P] [US1] Add integration tests for local-day bucketing and UTC timestamp handling in src/lib/features/nutrition/nutrition.server.test.ts
- [X] T019 [P] [US1] Add e2e test for fast log-add-edit-delete journey in e2e/nutrition.spec.ts

### Implementation for User Story 1

- [X] T020 [US1] Implement daily log entry list and inline edit/delete row state in src/routes/__index/_layout.nutrition/index.tsx
- [X] T021 [US1] Implement manual food-entry form fields and client-side validation in src/routes/__index/_layout.nutrition/index.tsx
- [X] T022 [US1] Implement create food-entry mutation and selected-day query invalidation in src/routes/__index/_layout.nutrition/index.tsx
- [X] T023 [US1] Implement update food-entry mutation with last-write-wins refresh handling in src/routes/__index/_layout.nutrition/index.tsx
- [X] T024 [US1] Implement delete food-entry mutation with instant totals refresh in src/routes/__index/_layout.nutrition/index.tsx
- [X] T025 [US1] Render daily totals cards from canonical calories and macro gram totals in src/routes/__index/_layout.nutrition/index.tsx
- [X] T026 [US1] Surface calorie-mismatch warning state for affected entries in src/routes/__index/_layout.nutrition/index.tsx
- [X] T027 [US1] Add no-goals summary fallback prompt while keeping logging enabled in src/routes/__index/_layout.nutrition/index.tsx

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Understand Daily Calorie Balance (Priority: P2)

**Goal**: Users can configure nutrition goals and clearly understand remaining calories, surplus/deficit status, and macro progress.

**Independent Test**: Configure goals, log foods under and over target, and verify balance labels and goal progress update in real time.

### Tests for User Story 2

- [X] T028 [P] [US2] Add unit tests for remaining-calorie and surplus-deficit labeling logic in src/lib/features/nutrition/nutrition.domain.test.ts
- [ ] T029 [P] [US2] Add integration tests for goals upsert and goal-dependent summary fields in src/lib/features/nutrition/nutrition.server.test.ts
- [ ] T030 [P] [US2] Add integration tests ensuring goal-dependent metrics are hidden when goals are missing in src/lib/features/nutrition/nutrition.server.test.ts
- [X] T031 [P] [US2] Add e2e test for goals setup and daily balance transitions in e2e/nutrition.spec.ts

### Implementation for User Story 2

- [X] T032 [US2] Implement goals configuration form and submit handling in src/routes/__index/_layout.nutrition/index.tsx
- [X] T033 [US2] Implement goals upsert mutation and dependent query invalidation in src/routes/__index/_layout.nutrition/index.tsx
- [X] T034 [US2] Render remaining calories and surplus/deficit labels only when goals exist in src/routes/__index/_layout.nutrition/index.tsx
- [X] T035 [US2] Render macro goal progress indicators for protein, carbs, and fats in src/routes/__index/_layout.nutrition/index.tsx
- [X] T036 [US2] Add explicit under-target, on-target, and over-target visual states in src/routes/__index/_layout.nutrition/index.tsx

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Review Historical Trends and Weight Correlation (Priority: P3)

**Goal**: Users can view daily nutrition trends over time and compare those trends with body weight on the same timeline.

**Independent Test**: Select a history range, verify nutrition trends render for past days, and confirm body-weight overlay displays where data exists without query failure when missing.

### Tests for User Story 3

- [X] T037 [P] [US3] Add unit tests for daily trend aggregation and macro-percentage rounding in src/lib/features/nutrition/nutrition.domain.test.ts
- [ ] T038 [P] [US3] Add integration tests for history range query and body-weight join behavior in src/lib/features/nutrition/nutrition.server.test.ts
- [ ] T039 [P] [US3] Add integration tests for null body-weight handling in history responses in src/lib/features/nutrition/nutrition.server.test.ts
- [X] T040 [P] [US3] Add e2e test for history chart and body-weight correlation view in e2e/nutrition.spec.ts

### Implementation for User Story 3

- [X] T041 [US3] Implement history date-range controls and query wiring in src/routes/__index/_layout.nutrition/index.tsx
- [X] T042 [US3] Render daily calorie and macro trend visualizations in src/routes/__index/_layout.nutrition/index.tsx
- [X] T043 [US3] Implement optional body-weight overlay toggle and display in src/routes/__index/_layout.nutrition/index.tsx
- [X] T044 [US3] Map nutrition and body-weight history points by local date in src/lib/features/nutrition/nutrition.server.ts
- [X] T045 [US3] Ensure weekly averages are excluded from history payload and UI in src/lib/features/nutrition/nutrition.server.ts and src/routes/__index/_layout.nutrition/index.tsx

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality hardening, performance validation, and release readiness.

- [X] T046 [P] Add conflict-notice UX polish for concurrent entry updates in src/routes/__index/_layout.nutrition/index.tsx
- [X] T047 [P] Add regression tests for auth and CSRF protections across nutrition mutations in src/lib/features/nutrition/nutrition.server.test.ts
- [X] T048 [P] Add responsive UI refinements for nutrition page mobile layouts in src/routes/__index/_layout.nutrition/index.tsx
- [X] T049 Validate quickstart verification flow and update command results in specs/003-nutrition-tracking/quickstart.md
- [X] T050 Run targeted typecheck and test commands and record outcomes in specs/003-nutrition-tracking/quickstart.md
- [X] T051 Validate spec success criteria coverage against implemented tasks in specs/003-nutrition-tracking/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): starts immediately.
- Foundational (Phase 2): depends on Setup completion and blocks all user stories.
- User Stories (Phases 3-5): depend on Foundational completion.
- Polish (Phase 6): depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): no dependency on other user stories after Foundational.
- US2 (P2): depends on foundational nutrition models/services, but remains independently testable from US3.
- US3 (P3): depends on foundational nutrition history contracts and existing body-weight series availability, but remains independently testable from US2.

### Within Each User Story

- Write tests first and ensure they fail before implementation where feasible.
- Complete domain/service behavior before final UI polish.
- Verify query invalidation and cache refresh behavior before story sign-off.

### Parallel Opportunities

- Setup: T002, T003, and T004 can run in parallel.
- Foundational: T009 and T013 can run in parallel after T007-T008 begin.
- Story-level test tasks marked [P] can run in parallel.
- Polish: T046, T047, and T048 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel test work for US1
Task T016: unit tests for nutrition math in src/lib/features/nutrition/nutrition.domain.test.ts
Task T017: integration tests for food-entry mutations in src/lib/features/nutrition/nutrition.server.test.ts
Task T018: integration tests for day-boundary behavior in src/lib/features/nutrition/nutrition.server.test.ts
Task T019: e2e log-add-edit-delete flow in e2e/nutrition.spec.ts
```

## Parallel Example: User Story 2

```bash
# Parallel test work for US2
Task T028: unit tests for daily balance labeling in src/lib/features/nutrition/nutrition.domain.test.ts
Task T029: integration tests for goals upsert behavior in src/lib/features/nutrition/nutrition.server.test.ts
Task T030: integration tests for missing-goal summary behavior in src/lib/features/nutrition/nutrition.server.test.ts
Task T031: e2e goals and balance transition flow in e2e/nutrition.spec.ts
```

## Parallel Example: User Story 3

```bash
# Parallel test work for US3
Task T037: unit tests for trend aggregation in src/lib/features/nutrition/nutrition.domain.test.ts
Task T038: integration tests for nutrition history with weight join in src/lib/features/nutrition/nutrition.server.test.ts
Task T039: integration tests for null weight points in src/lib/features/nutrition/nutrition.server.test.ts
Task T040: e2e history correlation flow in e2e/nutrition.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks T016-T027.
3. Validate US1 independently before moving to US2.

### Incremental Delivery

1. Deliver US1 (daily logging and immediate totals).
2. Deliver US2 (goal-aware summary and balance states).
3. Deliver US3 (history and body-weight correlation).
4. Complete Phase 6 polish and quality hardening.

### Parallel Team Strategy

1. One developer handles data and service foundations (T007-T015).
2. One developer handles route/UI foundations (T002, T005, T006, T014).
3. After foundations, split by story owners:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3

---

## Notes

- All tasks follow required checklist format with IDs and file paths.
- [P] marks tasks that can execute in parallel.
- [US1], [US2], and [US3] labels are used only for user story phases.
- Weekly averages remain explicitly excluded from MVP scope.

## Success Criteria Coverage Validation (T051)

- SC-001 is covered by fast-entry UX and e2e flow coverage in T019/T021/T022.
- SC-002 is covered by immediate invalidation and refresh paths in T022/T023/T024/T025/T033/T041 and corresponding e2e/unit coverage tasks.
- SC-003 is covered by explicit balance-state rendering and transitions in T034/T036/T031.
- SC-004 requires post-release analytics measurement and is not directly verifiable with current automated test suite; behavior support is implemented through logging and history flows (T020-T027, T041-T045).
- SC-005 is covered by history and bodyweight correlation behavior in T043/T044/T040, with null bodyweight handling protected by server and UI logic.
