# Quickstart: Equipment CRUD Management Page

## Goal
Plan and implement a dedicated Equipment CRUD page in the current TanStack Start app while preserving layered boundaries, data integrity, and test coverage requirements.

## Prerequisites
- Bun installed
- PostgreSQL reachable for Prisma operations
- Environment variables configured for app and database

## 1. Install and baseline checks
```bash
bun install
bun run generate
bun run typecheck
```

## 2. Implement backend equipment domain
1. Add server functions in `src/lib/equipment.server.ts`:
   - `getEquipmentListServerFn`
   - `createEquipmentServerFn`
   - `updateEquipmentServerFn`
   - `setEquipmentActiveStateServerFn`
2. Apply existing middleware pattern (`csrfProtectionMiddleware`, `authMiddleware`) for all mutations.
3. Add consistent error mapping for duplicate and not-found conditions.

## 3. Add validation contracts
1. Add Zod schemas for create/update/archive operations.
2. Reuse schemas on both client submission and server input validation.
3. Keep error strings aligned with existing mutation error message conventions.

## 4. Build route and UI
1. Add route folder `src/routes/__index/_layout.equipment/`.
2. Add query options for equipment list retrieval and route loader prefetch.
3. Build page with:
   - create form (`code`, `name`, `displayOrder`)
   - edit mode for existing rows
   - archive/restore action with confirmation
   - empty and error states
4. Add link/entry point in app navigation so the page is discoverable.

## 5. Keep movement integration stable
1. Ensure movement equipment picker continues to request active-only equipment.
2. Verify archived equipment is excluded from new selection flows.
3. Confirm existing movement rows with archived equipment still render correctly.

## 6. Validate with tests

### Unit and integration
```bash
bun test src/lib --run
bun test src/routes --run
```

### End-to-end
```bash
bun run test -- e2e/movements.spec.ts
```

## 7. Manual verification checklist
- Create equipment with valid values and see it in sorted list.
- Attempt duplicate `code` and duplicate `name`; confirm conflict messages.
- Edit `name` and `displayOrder`; confirm updates and reordering.
- Archive and restore equipment; confirm active-query behavior.
- Open movement create/edit flow and confirm active equipment list remains correct.

## 8. Definition of done
- Plan artifacts complete and constitution gates pass.
- Typecheck and tests pass for changed areas.
- Equipment CRUD route is accessible and stable on desktop and mobile widths.
- No layer-boundary violations (UI orchestration only, business logic in lib/server).
