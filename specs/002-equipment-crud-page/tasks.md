# Tasks: Equipment CRUD Management Page

**Input**: Design documents from /specs/002-equipment-crud-page/
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/equipment-crud-contract.md, quickstart.md

**Tests**: Unit, integration, and e2e tests are required by FR-010 and constitution test-gate rules.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: [ID] [P?] [Story] Description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish module structure and shared foundations.

- [X] T001 Create Equipment route folder and query subfolder in src/routes/__index/_layout.equipment/
- [X] T002 [P] Create Equipment query options file scaffold in src/routes/__index/_layout.equipment/-queries/equipment.ts
- [X] T003 [P] Create Equipment server test scaffold in src/lib/equipment.server.test.ts
- [X] T004 Add Equipment create/update/active-state schemas and shared errors in src/lib/validation/workout-progression.ts
- [X] T005 Implement Equipment server functions (list/create/update/set-active-state) in src/lib/equipment.server.ts
- [X] T006 [P] Add Prisma unique/not-found error mapping utilities for Equipment mutations in src/lib/equipment.server.ts

**Checkpoint**: Core Equipment server and validation surface is available.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared route and security/error-handling groundwork required by all stories.

- [X] T007 Export Equipment query options with deterministic sorting in src/routes/__index/_layout.equipment/-queries/equipment.ts
- [X] T008 Wire Equipment route loader prefetch in src/routes/__index/_layout.equipment/index.tsx
- [X] T009 Add Equipment page navigation entry in src/routes/__index/_layout.tsx
- [X] T010 Implement sanitized persistence error logging for equipment mutations in src/lib/equipment.server.ts
- [X] T011 [P] Add baseline Equipment page loading, empty, and error states in src/routes/__index/_layout.equipment/index.tsx
- [X] T012 [P] Add shared Equipment form state and normalization helpers in src/routes/__index/_layout.equipment/index.tsx

**Checkpoint**: Feature is reachable, prefetching data, and has foundational logging/security behavior.

---

## Phase 3: User Story 1 - Create and View Equipment Catalog (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can create equipment and view ordered catalog rows.

**Independent Test**: Open Equipment page, create valid rows, verify ordering, and validate duplicate + auth/CSRF protections.

### Tests for User Story 1

- [X] T013 [P] [US1] Add unit tests for create-equipment schema validation in src/lib/validation/workout-progression.test.ts
- [ ] T014 [P] [US1] Add integration tests for list/create Equipment server functions in src/lib/equipment.server.test.ts
- [ ] T015 [P] [US1] Add integration tests for unauthorized and missing-CSRF rejection on equipment mutations in src/lib/equipment.server.test.ts
- [ ] T016 [P] [US1] Add integration tests verifying sanitized persistence error responses with no internal leakage in src/lib/equipment.server.test.ts
- [X] T017 [P] [US1] Add e2e create-and-list Equipment flow in e2e/equipment.spec.ts

### Implementation for User Story 1

- [X] T018 [US1] Implement Equipment create form (code, name, displayOrder) in src/routes/__index/_layout.equipment/index.tsx
- [X] T019 [US1] Implement create mutation with CSRF headers and query invalidation in src/routes/__index/_layout.equipment/index.tsx
- [X] T020 [US1] Render Equipment list ordered by displayOrder then name in src/routes/__index/_layout.equipment/index.tsx
- [X] T021 [US1] Surface duplicate conflict and safe generic persistence error messaging in src/routes/__index/_layout.equipment/index.tsx
- [X] T022 [US1] Add e2e auth-guard and invalid-CSRF mutation path checks for Equipment page in e2e/equipment.spec.ts

**Checkpoint**: US1 is independently functional and fully testable.

---

## Phase 4: User Story 2 - Edit and Reorder Equipment (Priority: P1)

**Goal**: Users can edit Equipment fields and reorder catalog rows without breaking references.

**Independent Test**: Edit existing rows, verify persistence and order changes, and confirm reference integrity.

### Tests for User Story 2

- [X] T023 [P] [US2] Add unit tests for update-equipment schema validation in src/lib/validation/workout-progression.test.ts
- [ ] T024 [P] [US2] Add integration tests for update mutation conflict/not-found handling in src/lib/equipment.server.test.ts
- [X] T025 [P] [US2] Add e2e edit-and-reorder workflow in e2e/equipment.spec.ts

### Implementation for User Story 2

- [X] T026 [US2] Implement row edit mode with prefilled fields in src/routes/__index/_layout.equipment/index.tsx
- [X] T027 [US2] Implement update mutation and refresh behavior in src/routes/__index/_layout.equipment/index.tsx
- [X] T028 [US2] Add deterministic update conflict and not-found UX messaging in src/routes/__index/_layout.equipment/index.tsx
- [ ] T029 [US2] Add regression test confirming movement equipment references remain valid after equipment updates in src/lib/equipment.server.test.ts

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Archive and Restore Equipment (Priority: P2)

**Goal**: Users can archive/restore Equipment while active pickers remain clean and historical references intact.

**Independent Test**: Toggle active state and verify picker inclusion/exclusion behavior.

### Tests for User Story 3

- [X] T030 [P] [US3] Add unit tests for active-state toggle schema validation in src/lib/validation/workout-progression.test.ts
- [ ] T031 [P] [US3] Add integration tests for set-active-state mutation and active-only list query in src/lib/equipment.server.test.ts
- [X] T032 [P] [US3] Add e2e archive/restore and movement-picker exclusion coverage in e2e/equipment.spec.ts

### Implementation for User Story 3

- [X] T033 [US3] Implement archive/restore action controls and confirmation flow in src/routes/__index/_layout.equipment/index.tsx
- [X] T034 [US3] Implement active-state toggle mutation with list refresh in src/routes/__index/_layout.equipment/index.tsx
- [X] T035 [US3] Ensure active-only ordered equipment retrieval for movement picker in src/lib/movements.server.ts
- [X] T036 [US3] Add movement query regression assertion for archived equipment exclusion in src/routes/__index/_layout.movements/-queries/movements.test.ts

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize quality, measurable performance, and execution validation.

- [ ] T037 [P] Verify and document Equipment page render performance for 500 records in specs/002-equipment-crud-page/quickstart.md
- [ ] T038 [P] Perform responsive UI polish and action-state feedback refinements in src/routes/__index/_layout.equipment/index.tsx
- [ ] T039 [P] Add cross-story regression assertions (create/update/archive + safe error handling) in src/lib/equipment.server.test.ts
- [ ] T040 Run targeted test suites and capture pass commands in specs/002-equipment-crud-page/quickstart.md
- [ ] T041 Validate full feature acceptance checklist against spec success criteria in specs/002-equipment-crud-page/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): starts immediately.
- Foundational (Phase 2): depends on Setup completion and blocks user stories.
- User Stories (Phases 3-5): depend on Foundational completion.
- Polish (Phase 6): depends on completion of targeted user stories.

### User Story Dependencies

- US1 (P1): no dependency on other stories after Foundational.
- US2 (P1): depends on existing rows from US1 or fixtures but remains independently testable.
- US3 (P2): depends on active list/create baseline and remains independently testable.

### Within Each User Story

- Write tests first and ensure they fail before implementation when feasible.
- Complete server behavior and validation before final UI polish.
- Verify mutation error handling and cache updates before story sign-off.

### Parallel Opportunities

- Phase 1: T002, T003, T006 can run in parallel.
- Phase 2: T011 and T012 can run in parallel.
- Story test tasks marked [P] can run in parallel within each story.
- Phase 6: T037, T038, and T039 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel test work for US1
Task T013: create schema unit tests in src/lib/validation/workout-progression.test.ts
Task T014: list/create integration tests in src/lib/equipment.server.test.ts
Task T015: auth/csrf negative-path integration tests in src/lib/equipment.server.test.ts
Task T017: create/list e2e flow in e2e/equipment.spec.ts
```

## Parallel Example: User Story 2

```bash
# Parallel test work for US2
Task T023: update schema unit tests in src/lib/validation/workout-progression.test.ts
Task T024: update conflict integration tests in src/lib/equipment.server.test.ts
Task T025: edit/reorder e2e flow in e2e/equipment.spec.ts
```

## Parallel Example: User Story 3

```bash
# Parallel test work for US3
Task T030: active-state schema unit tests in src/lib/validation/workout-progression.test.ts
Task T031: active-state integration tests in src/lib/equipment.server.test.ts
Task T032: archive/restore e2e flow in e2e/equipment.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks T013-T022.
3. Validate US1 independently before moving to US2.

### Incremental Delivery

1. Deliver US1 (create/view + security-negative path checks).
2. Deliver US2 (edit/reorder).
3. Deliver US3 (archive/restore + active-picker behavior).
4. Complete Phase 6 polish and validation.

### Parallel Team Strategy

1. One developer handles server and validation foundations (T004-T010).
2. One developer handles route foundations (T007-T012).
3. After foundations, split by story owners:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3

---

## Notes

- All tasks follow the required checklist format with IDs and file paths.
- [P] marks tasks that can execute in parallel.
- Story labels are used only for user story phases.
- This task set explicitly covers security-negative testing, sanitized persistence error handling, and measurable performance verification.
