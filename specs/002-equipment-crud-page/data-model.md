# Data Model: Equipment CRUD Management Page

## Overview
This feature introduces full management workflows for the existing `Equipment` catalog entity and formalizes its interaction boundaries with `Movement`.

## Entities

### Equipment (existing, behavior extended)
- Purpose: Controlled catalog that classifies movements and drives equipment dropdown options.
- Key fields:
  - `id` (UUID, PK)
  - `code` (string, unique, stable identifier)
  - `name` (string, unique display label)
  - `isActive` (boolean, lifecycle state)
  - `displayOrder` (int, operator-defined ordering)
  - `createdAt`, `updatedAt`
- Relationships:
  - One-to-many `Movement`
- Validation rules:
  - `code`: required, trimmed, normalized, max length bounded.
  - `name`: required, trimmed, human readable, max length bounded.
  - `displayOrder`: integer in bounded range.
  - `code` and `name` must remain unique.

### Movement (existing, impacted)
- Purpose: User-defined exercise entity optionally linked to equipment.
- Relevant fields:
  - `equipmentId` (nullable FK -> Equipment)
  - `archivedAt`
- Interaction rules for this feature:
  - Existing movement references remain valid during equipment updates.
  - Active-only equipment queries power movement forms.
  - Archived equipment may still appear in historical movement render contexts where needed.

## State Transitions

### Equipment lifecycle
1. `active` (`isActive=true`) when created or restored.
2. `archived` (`isActive=false`) when toggled off.
3. `active` again via restore action.

No hard delete state is included in this feature scope.

## Invariants

- Unique constraints on `Equipment.code` and `Equipment.name` are authoritative.
- Catalog list sorting is deterministic by `displayOrder ASC, name ASC`.
- Archive/restore operations must not nullify or break `Movement.equipmentId` references.
- Movement equipment selector consumes active records only.

## Error Semantics

- Duplicate `code` or `name` maps to conflict domain errors for user-friendly messaging.
- Missing equipment record on update/archive maps to not-found domain errors.
- Invalid input types/ranges are rejected at validation boundary before persistence.

## Query and Indexing Notes

- Existing index `@@index([isActive, displayOrder])` supports active list and ordering.
- Add/confirm secondary ordering by `name` in query layer for deterministic ties.
- For future large catalogs, pagination/search can be added without changing entity contracts.
