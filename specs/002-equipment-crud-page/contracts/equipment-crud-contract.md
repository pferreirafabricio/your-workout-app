# Equipment CRUD Contract

## Scope
Contract for Equipment management interfaces in the TanStack Start application.

## Route Contract

- Route path: `/__index/_layout/equipment/`
- Access: authenticated users only
- Loader behavior:
  - Prefetch equipment list query before render
  - Return list ordered by `displayOrder ASC, name ASC`

## Query Contract

### `getEquipmentListServerFn`
- Method: server function (read)
- Auth required: yes
- Input: none
- Output:
```ts
{
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}[]
```
- Ordering: `displayOrder ASC`, then `name ASC`

## Mutation Contracts

### `createEquipmentServerFn`
- Method: `POST`
- Auth + CSRF required: yes
- Input:
```ts
{
  code: string;
  name: string;
  displayOrder: number;
}
```
- Success output:
```ts
{
  success: true;
  equipment: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
  };
}
```
- Failure output:
```ts
{
  success: false;
  error: "VALIDATION_ERROR" | "CONFLICT";
  message?: string;
}
```

### `updateEquipmentServerFn`
- Method: `POST`
- Auth + CSRF required: yes
- Input:
```ts
{
  equipmentId: string;
  code: string;
  name: string;
  displayOrder: number;
}
```
- Success output: same shape as create
- Failure output:
```ts
{
  success: false;
  error: "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT";
  message?: string;
}
```

### `setEquipmentActiveStateServerFn`
- Method: `POST`
- Auth + CSRF required: yes
- Input:
```ts
{
  equipmentId: string;
  isActive: boolean;
}
```
- Success output:
```ts
{
  success: true;
  equipment: {
    id: string;
    isActive: boolean;
    updatedAt: Date;
  };
}
```
- Failure output:
```ts
{
  success: false;
  error: "VALIDATION_ERROR" | "NOT_FOUND";
  message?: string;
}
```

## Validation Rules

- `code`: required, trimmed, max length 64, normalized format (uppercase snake or slug style chosen by implementation).
- `name`: required, trimmed, max length 120.
- `displayOrder`: integer, bounded range (recommended 0..9999).
- `equipmentId`: non-empty string for update/archive operations.

## Behavioral Guarantees

- Unique constraints on `code` and `name` are enforced and surfaced as deterministic conflict errors.
- Archive action (`isActive=false`) excludes equipment from active-only picker queries.
- Restore action (`isActive=true`) re-includes equipment in active-only picker queries.
- Existing movement references to archived equipment remain valid.

## Testing Expectations

- Unit: validation schema + conflict mapping logic.
- Integration: route loader/query integration and mutation boundary behavior.
- E2E: create, edit, archive, restore, and movement picker active-only behavior.
