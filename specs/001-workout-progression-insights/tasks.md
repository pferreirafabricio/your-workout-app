# Tasks: Workout Progression Insights

**Input**: Design documents from `/specs/001-workout-progression-insights/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workout-progression-contract.md, quickstart.md

## Phase 1: Setup

**Purpose**: Initialize feature scaffolding, shared utilities, and test harness updates.

- [X] T001 Create feature task index and implementation notes in specs/001-workout-progression-insights/checklists/requirements.md
- [X] T002 [P] Add feature-level constants for units/metrics/rest defaults in src/lib/types.ts
- [X] T003 [P] Add shared numeric/date formatting helpers for progression displays in src/lib/utils.ts
- [X] T004 [P] Add Playwright test data helpers for progression workflows in e2e/helpers/progression-fixtures.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete schema and server foundations required by all user stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase completes.

- [X] T005 Update core Prisma models and enums (muscleGroup enum, movement archive fields, set snapshots, preferences, bodyweight, lockout) in prisma/schema.prisma
- [X] T006 Add Equipment catalog model and relations in prisma/schema.prisma
- [X] T007 Create migration for schema extensions in prisma/db/migrations/<timestamp>_workout_progression_foundation/migration.sql
- [X] T008 Prepopulate Equipment catalog seed rows in prisma/db/migrations/<timestamp>_workout_progression_foundation/migration.sql
- [X] T009 Remove passwordHashAlgorithm field from schema plans and design docs in specs/001-workout-progression-insights/data-model.md
- [X] T010 Remove passwordHashAlgorithm references from implementation plan in specs/001-workout-progression-insights/plan.md
- [X] T011 [P] Implement canonical kg/lbs conversion utility for input/display boundaries in src/lib/utils.ts
- [X] T012 [P] Add shared Zod schemas for mutation payloads and aligned error messages in src/lib/validation/workout-progression.ts
- [X] T013 [P] Add security helpers for password hashing and lockout window checks in src/lib/auth.server.ts

**Checkpoint**: Foundation ready for independent user story delivery.

---

## Phase 3: User Story 1 - Fast Workout Logging (Priority: P1) 🎯 MVP

**Goal**: Start workouts, log/edit/delete sets quickly, and complete workout sessions with durable persistence.

**Independent Test**: Start a workout, add movement sets, edit/delete sets inline, complete workout, and verify history consistency.

### Tests

- [X] T014 [P] [US1] Add unit tests for set volume/workout total recalculation logic in src/lib/workouts.server.test.ts
- [X] T015 [P] [US1] Add integration tests for current workout query/mutation boundaries in src/routes/__index/_layout.current-workout/-queries/current-workout.test.ts
- [X] T016 [P] [US1] Add Playwright e2e flow for start workout -> log/edit/delete sets -> complete workout in e2e/workouts.spec.ts

### Core

- [X] T017 [US1] Implement start/update/complete workout server mutations and summaries in src/lib/workouts.server.ts
- [X] T018 [US1] Implement set add/update/delete server mutations with durable persistence in src/lib/workouts.server.ts
- [X] T019 [US1] Implement last-write-wins conflict replacement notice payload for set edits in src/lib/workouts.server.ts
- [X] T020 [US1] Add set list and inline edit/delete UI interactions in src/routes/__index/_layout.current-workout/index.tsx
- [X] T021 [US1] Add movement-in-workout selection and set entry flow in src/routes/__index/_layout.current-workout/index.tsx

### Integration

- [X] T022 [US1] Wire current workout query client integration for optimistic and refresh-safe updates in src/routes/__index/_layout.current-workout/-queries/current-workout.ts
- [X] T023 [US1] Add workout completion summary rendering (duration, total volume) in src/routes/__index/_layout.current-workout/index.tsx
- [X] T024 [US1] Add frontend validation for addSet mutation (reps/weight/rpe/notes/loggedAt) in src/routes/__index/_layout.current-workout/index.tsx
- [X] T025 [US1] Add backend validation for addSet mutation in src/lib/validation/workout-progression.ts
- [X] T026 [US1] Add frontend validation for updateSet mutation in src/routes/__index/_layout.current-workout/index.tsx
- [X] T027 [US1] Add backend validation for updateSet mutation in src/lib/validation/workout-progression.ts
- [X] T028 [US1] Add frontend validation for deleteSet mutation confirmation and guarded states in src/routes/__index/_layout.current-workout/index.tsx
- [X] T029 [US1] Add backend validation for deleteSet mutation ownership/state checks in src/lib/validation/workout-progression.ts
- [X] T030 [US1] Add frontend validation for completeWorkout mutation readiness and error feedback in src/routes/__index/_layout.current-workout/index.tsx
- [X] T031 [US1] Add backend validation for completeWorkout mutation active-workout checks in src/lib/validation/workout-progression.ts

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Bodyweight-Aware Tracking and Unit Preference (Priority: P1)

**Goal**: Support bodyweight defaults, immutable set snapshots, and global kg/lbs preference consistency.

**Independent Test**: Log weighted and bodyweight movements, switch preferred unit, and verify cross-screen consistency.

### Tests

- [X] T032 [P] [US2] Add unit tests for bodyweight snapshot defaulting and conversion invariants in src/lib/workouts.server.test.ts
- [X] T033 [P] [US2] Add integration tests for preference persistence and bodyweight defaults in src/routes/__index/_layout.current-workout/-queries/current-workout.test.ts
- [X] T034 [P] [US2] Add Playwright e2e test for unit switch and bodyweight logging flow in e2e/sets.spec.ts

### Core

- [X] T035 [US2] Implement body weight entry create/query server logic in src/lib/workouts.server.ts
- [X] T036 [US2] Implement user preference read/write server logic for weight unit and rest target defaults in src/lib/workouts.server.ts
- [X] T037 [US2] Implement bodyweight movement auto-fill from latest body weight with immutable snapshot persistence in src/lib/workouts.server.ts
- [X] T038 [US2] Update current-workout UI to prompt for missing bodyweight context before set save in src/routes/__index/_layout.current-workout/index.tsx
- [X] T039 [US2] Add UI controls for unit preference and body weight entry management in src/routes/__index/index.tsx

### Integration

- [X] T040 [US2] Wire preference and bodyweight queries/mutations into current workout query layer in src/routes/__index/_layout.current-workout/-queries/current-workout.ts
- [X] T041 [US2] Add frontend validation for setUserPreferences mutation in src/routes/__index/index.tsx
- [X] T042 [US2] Add backend validation for setUserPreferences mutation in src/lib/validation/workout-progression.ts
- [X] T043 [US2] Add frontend validation for recordBodyWeight mutation in src/routes/__index/index.tsx
- [X] T044 [US2] Add backend validation for recordBodyWeight mutation in src/lib/validation/workout-progression.ts

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Rest Timing and Immediate Feedback (Priority: P2)

**Goal**: Start/reset rest timing from set events and indicate target-rest attainment.

**Independent Test**: Save consecutive sets and verify timer start, threshold indicator, and reset behavior.

### Tests

- [X] T045 [P] [US3] Add unit tests for elapsed rest calculations and reset rules in src/lib/workouts.server.test.ts
- [X] T046 [P] [US3] Add integration tests for rest baseline in current workout query responses in src/routes/__index/_layout.current-workout/-queries/current-workout.test.ts
- [X] T047 [P] [US3] Add Playwright e2e rest-timer behavior test in e2e/sets.spec.ts

### Core

- [X] T048 [US3] Implement rest timer baseline derivation from persisted set timestamps in src/lib/workouts.server.ts
- [X] T049 [US3] Add rest timer UI state and target reached indicator in src/routes/__index/_layout.current-workout/index.tsx

### Integration

- [X] T050 [US3] Expose rest timer and configured target in current workout query contract in src/routes/__index/_layout.current-workout/-queries/current-workout.ts

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Progression and History Insights (Priority: P2)

**Goal**: Provide trend views for movement metrics and bodyweight history over time.

**Independent Test**: Load historical data and verify progression series values for max weight, total reps, total volume, and bodyweight trends.

### Tests

- [X] T051 [P] [US4] Add unit tests for daily progression aggregation metrics in src/lib/workouts.server.test.ts
- [X] T052 [P] [US4] Add integration tests for history/progression filters and series outputs in src/routes/__index/_layout.workout-history/-queries/workout-history.test.ts
- [X] T053 [P] [US4] Add Playwright e2e test for progression metric selection and history visualization in e2e/workouts.spec.ts

### Core

- [X] T054 [US4] Implement progression series and workout history aggregation queries in src/lib/workouts.server.ts
- [X] T055 [US4] Implement body weight history series query in src/lib/workouts.server.ts
- [X] T056 [US4] Add progression metric selector and timeline rendering UI in src/routes/__index/_layout.workout-history/index.tsx

### Integration

- [X] T057 [US4] Wire workout history and progression queries to UI filter controls in src/routes/__index/_layout.workout-history/-queries/workout-history.ts

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: User Story 5 - Account and Data Protection Foundations (Priority: P3)

**Goal**: Enforce hashed credential storage, lockout controls, and secure mutation/session boundaries.

**Independent Test**: Verify sign-in success/failure behavior, lockout policy, and protected mutation access boundaries.

### Tests

- [X] T058 [P] [US5] Add unit tests for lockout window policy and password verification helpers in src/lib/auth.server.test.ts
- [X] T059 [P] [US5] Add integration tests for sign-in lockout and protected route behavior in src/routes/sign-in.test.tsx
- [X] T060 [P] [US5] Add Playwright e2e test for repeated failed sign-ins and timed lockout in e2e/auth-lockout.spec.ts

### Core

- [X] T061 [US5] Migrate sign-in and account creation to adaptive password hashing and constant-time verification in src/lib/auth.server.ts
- [X] T062 [US5] Implement failed-attempt tracking and 5-in-15 lockout with 15-minute expiry in src/lib/auth.server.ts
- [X] T063 [US5] Update sign-in and create-account routes to consume lockout-aware auth responses in src/routes/sign-in.tsx
- [X] T064 [US5] Update account creation route to align with hashed credential policy in src/routes/create-account.tsx

### Integration

- [X] T065 [US5] Add frontend validation for signIn mutation payload and lockout feedback rendering in src/routes/sign-in.tsx
- [X] T066 [US5] Add backend validation for signIn mutation payload, abuse threshold checks, and structured errors in src/lib/validation/workout-progression.ts

**Checkpoint**: User Story 5 is independently functional and testable.

---

## Phase 8: Movement Metadata and Catalog Integration (Cross-Story Completion)

**Goal**: Complete movement metadata workflows including muscle group enum, equipment catalog, and archival behavior in active flows.

**Independent Test**: Create/update/archive movement with muscle group and equipment; confirm archived movements remain in history and are blocked from new logging.

### Tests

- [X] T067 [P] Add integration tests for movement metadata constraints and archive visibility rules in src/routes/__index/_layout.movements/-queries/movements.test.ts
- [X] T068 [P] Add Playwright e2e tests for movement create/update/archive with equipment and muscle group selection in e2e/movements.spec.ts

### Core

- [X] T069 Implement movement CRUD server logic including muscleGroup enum and equipment FK behavior in src/lib/movements.server.ts
- [X] T070 Implement equipment catalog query endpoint for movement forms in src/lib/movements.server.ts
- [X] T071 Add movement management UI fields for muscle group and equipment selection in src/routes/__index/_layout.movements/index.tsx
- [X] T072 Add archive movement UX and archived-state display in movement lists in src/routes/__index/_layout.movements/index.tsx

### Integration

- [X] T073 Add frontend validation for createMovement mutation (name/type/muscleGroup/equipmentId) in src/routes/__index/_layout.movements/index.tsx
- [X] T074 Add backend validation for createMovement mutation in src/lib/validation/workout-progression.ts
- [X] T075 Add frontend validation for updateMovement mutation in src/routes/__index/_layout.movements/index.tsx
- [X] T076 Add backend validation for updateMovement mutation in src/lib/validation/workout-progression.ts
- [X] T077 Add frontend validation for archiveMovement mutation confirmation and active-workout guardrails in src/routes/__index/_layout.movements/index.tsx
- [X] T078 Add backend validation for archiveMovement mutation archival invariants and ownership checks in src/lib/validation/workout-progression.ts

**Checkpoint**: Movement metadata/categorization behavior is complete and testable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, performance, and release-readiness checks across all stories.

- [X] T079 [P] Update feature documentation and mutation validation matrix in specs/001-workout-progression-insights/quickstart.md
- [X] T080 [P] Add cross-story regression integration tests for conflicting set edits and replacement notices in src/routes/__index/_layout.current-workout/-queries/current-workout.test.ts
- [X] T081 [P] Optimize progression/history query performance with indexes and query shape tuning in src/lib/workouts.server.ts
- [X] T082 Run full quality gates (typecheck, unit/integration, Playwright) and capture release notes in specs/001-workout-progression-insights/checklists/requirements.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies.
- Foundational (Phase 2) depends on Setup and blocks all story phases.
- User Story phases (Phases 3-8) depend on Foundational completion.
- Polish (Phase 9) depends on all targeted user story phases.

### User Story Dependencies

- US1 can start immediately after Foundational.
- US2 depends on Foundational and reuses US1 workout set flows for bodyweight defaults.
- US3 depends on US1 set logging completion events.
- US4 depends on US1/US2 data correctness for trends.
- US5 depends on Foundational security schema updates; otherwise independent from workout UI delivery.
- Movement metadata phase depends on Foundational and feeds US1/US2 movement selection behavior.

### Task-Level Highlights

- T005-T010 must complete before any mutation implementation tasks.
- All backend validation tasks (T025, T027, T029, T031, T042, T044, T066, T074, T076, T078) must complete before corresponding integration/e2e exit checks.
- Equipment prepopulation (T008) must complete before movement equipment UI integration tasks (T071, T073-T076).

---

## Parallel Execution Examples

### User Story 1

- Run in parallel: T014, T015, T016
- Run in parallel after T018: T024, T025, T026, T027, T028, T029, T030, T031

### User Story 2

- Run in parallel: T032, T033, T034
- Run in parallel after T036: T041, T042, T043, T044

### User Story 5

- Run in parallel: T058, T059, T060
- Run in parallel after T062: T065, T066

### Movement Metadata

- Run in parallel: T067, T068
- Run in parallel after T071: T073, T074, T075, T076, T077, T078

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) as first production increment.
3. Validate US1 independently before expanding scope.

### Incremental Delivery

1. Add Phase 4 (US2) to complete P1 value set.
2. Add Phases 5 and 6 (US3/US4) for progression feedback and insights.
3. Add Phase 7 (US5) and Phase 8 movement metadata integration.
4. Finish with Phase 9 polish and release gates.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. After Foundational: split by story stream (US1/US2, US3/US4, US5, Movement Metadata).
3. Merge at validation matrix checkpoints and final polish.
