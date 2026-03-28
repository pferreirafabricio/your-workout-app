# Feature Specification: Equipment CRUD Management Page

**Feature Branch**: `002-equipment-crud-page`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "help me plan to create a page for the CRUD operations for the entity Equipments"

## User Scenarios & Testing *(mandatory)*

Every user story includes unit, integration, and end-to-end coverage for behavior in scope.

### User Story 1 - Create and View Equipment Catalog (Priority: P1)

As an authenticated admin/operator, I can open an Equipment management page, create equipment items, and see them listed in a stable order.

**Why this priority**: Creation and visibility are the baseline capabilities required before any edit/archive workflow has value.

**Independent Test**: This story is independently testable by creating several equipment items and verifying list rendering, sort order, and uniqueness handling.

**Test Coverage Notes**: Unit tests for equipment input validation and normalization; integration tests for route loader + server function data boundaries; e2e test for page load and create flow.

**Acceptance Scenarios**:

1. **Given** I am authenticated, **When** I open the Equipment page, **Then** I see the equipment list ordered by `displayOrder` then `name`.
2. **Given** I provide valid `code`, `name`, and `displayOrder`, **When** I submit create, **Then** the item is persisted and appears in the list.
3. **Given** an existing equipment `code` or `name`, **When** I submit a duplicate, **Then** the system rejects it with a clear validation error.

---

### User Story 2 - Edit and Reorder Equipment (Priority: P1)

As an authenticated admin/operator, I can edit equipment fields and adjust ordering so the movement form presents a curated catalog.

**Why this priority**: Operators need to correct labels and ordering as the catalog evolves, otherwise initial data quality decays quickly.

**Independent Test**: This story is independently testable by editing existing records and confirming update persistence plus ordering changes in both Equipment and Movement contexts.

**Test Coverage Notes**: Unit tests for update schema and normalization; integration tests for update mutation path and optimistic cache invalidation behavior; e2e test for in-page edit/save flow.

**Acceptance Scenarios**:

1. **Given** an existing equipment item, **When** I edit `name` or `displayOrder`, **Then** the update is persisted and list order reflects the new value.
2. **Given** another row already uses the target `name` or `code`, **When** I save edits, **Then** the update is rejected with a non-generic message.
3. **Given** movement records already reference an equipment item, **When** I edit it, **Then** all references remain valid without movement data loss.

---

### User Story 3 - Archive and Restore Equipment (Priority: P2)

As an authenticated admin/operator, I can archive equipment to hide it from movement selection and restore it later if needed.

**Why this priority**: Lifecycle control keeps the selection list clean while preserving historical references and operational flexibility.

**Independent Test**: This story is independently testable by toggling `isActive` and verifying active-only movement picker behavior.

**Test Coverage Notes**: Unit tests for archive/restore input validation; integration tests for active-filtered query semantics; e2e test for archive/restore actions and downstream picker impact.

**Acceptance Scenarios**:

1. **Given** an active equipment item, **When** I archive it, **Then** it no longer appears in active equipment queries.
2. **Given** an archived equipment item, **When** I restore it, **Then** it is included again in active equipment queries.
3. **Given** movements referencing archived equipment, **When** I view those movements, **Then** existing references remain readable and intact.

### Edge Cases

- Two users attempt to create the same `code` simultaneously.
- An update changes only capitalization/spacing of `name` and must not create duplicate-semantic records.
- `displayOrder` collisions occur across many rows; ordering remains deterministic.
- Archiving equipment that is currently selected in an unsaved movement form.
- Very large catalog sizes where list rendering and sort behavior must remain responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an authenticated Equipment management page in the existing app navigation.
- **FR-002**: System MUST allow creating equipment with required fields `code`, `name`, `displayOrder`, and default `isActive=true`.
- **FR-003**: System MUST enforce uniqueness of `code` and `name` and return user-friendly errors for conflicts.
- **FR-004**: System MUST allow editing `code`, `name`, and `displayOrder` for existing equipment records.
- **FR-005**: System MUST allow archive/restore via `isActive` toggling without deleting rows.
- **FR-006**: System MUST preserve referential integrity for existing `Movement.equipmentId` references during updates and archive/restore actions.
- **FR-007**: System MUST return active equipment ordered by `displayOrder` then `name` for movement forms.
- **FR-008**: System MUST validate create/update/archive inputs on both client and server.
- **FR-009**: System MUST log and handle persistence errors without exposing sensitive internals to end users.
- **FR-010**: System MUST include test coverage across unit, integration, and e2e layers for the Equipment CRUD journey.

### Key Entities *(include if feature involves data)*

- **Equipment**: Catalog entity with `id`, `code`, `name`, `isActive`, `displayOrder`, timestamps, and relations to movements.
- **Movement**: Existing entity with optional `equipmentId` foreign key that consumes active equipment options.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of valid equipment create operations succeed on first submission in test and staging environments.
- **SC-002**: 100% of duplicate `code` or `name` operations return deterministic conflict messaging.
- **SC-003**: Equipment list page loads and renders first content in under 2 seconds for catalogs up to 500 records.
- **SC-004**: Archived equipment is excluded from active picker queries in 100% of tested cases.
- **SC-005**: All planned unit, integration, and e2e tests for Equipment CRUD pass in CI.

## Assumptions

- Equipment management is restricted to authenticated app users in this phase; role-based authorization can be added later.
- Soft lifecycle control (`isActive`) is sufficient for v1; hard delete is out of scope.
- Existing Prisma model for `Equipment` remains the source of truth with no new table required.
- Existing movement forms should continue consuming active equipment from a shared query.
