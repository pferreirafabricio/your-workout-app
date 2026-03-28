# Phase 0 Research: Workout Progression Insights

## Decision 1: Bodyweight set values are immutable snapshots
- Decision: Store final set weight value at log-time (including bodyweight defaults) and never retroactively mutate historical sets.
- Rationale: Preserves longitudinal metric integrity and avoids history drift when body weight entries are edited later.
- Alternatives considered:
  - Dynamic recomputation from latest body weight: rejected because historical analytics become unstable.
  - Optional recompute tool in core flow: deferred to future admin/maintenance tooling.

## Decision 2: Movement deletion strategy uses archive semantics
- Decision: Replace destructive movement deletion with archive (soft delete) behavior; archived movements cannot be newly selected but remain visible in historical sets.
- Rationale: Prevents referential/history loss while keeping movement picker clean.
- Alternatives considered:
  - Hard delete with cascading set removal: rejected due to irreversible data loss.
  - Block delete when references exist: rejected because it creates unusable stale movement lists.

## Decision 3: Conflict resolution for concurrent set edits
- Decision: Use deterministic last-write-wins for same-set concurrent edits and emit a visible replacement notice to the user.
- Rationale: Keeps logging fast, predictable, and resilient under multi-tab/device edits.
- Alternatives considered:
  - First-write-wins: rejected because it fails legitimate late updates.
  - Manual merge: rejected as too disruptive during workouts.
  - Per-field merge: rejected due to complexity and unclear user mental model.

## Decision 4: Sign-in abuse protection threshold
- Decision: Temporary lockout for 15 minutes after 5 failed attempts in a 15-minute rolling window per account and client source.
- Rationale: Meets security requirement while preserving account usability.
- Alternatives considered:
  - No lockout: insufficient protection.
  - Aggressive 3-attempt lockout: likely to increase false positives and support burden.

## Decision 5: Password handling modernization
- Decision: Migrate from plaintext password comparison/storage to adaptive hashing (bcrypt or argon2id) with constant-time verification through a vetted library.
- Rationale: Constitution mandates security-first auth handling and prohibits plaintext credentials.
- Alternatives considered:
  - Keep existing plaintext with transport-only protections: rejected as non-compliant.
  - Homegrown hashing implementation: rejected due to security risk.

## Decision 6: Unit conversion strategy (kg/lbs)
- Decision: Persist canonical weight snapshots in a single canonical unit for analytics consistency and convert at input/display boundaries according to user preference.
- Rationale: Prevents aggregation drift and simplifies query logic for progression metrics.
- Alternatives considered:
  - Persist values in user-selected unit per set: rejected because cross-period analytics become error-prone.
  - Convert historical records on preference switch: rejected due to mutation risk and audit ambiguity.

## Decision 7: Rest timer behavior model
- Decision: Rest timer state is event-driven from set completion timestamps; timer starts immediately after set completion and resets upon next set save.
- Rationale: Works consistently across refreshes/devices when computed from persisted timestamps.
- Alternatives considered:
  - Pure client interval state only: rejected because refresh/tab changes lose correctness.
  - Separate persisted timer entity for every movement in v1: deferred unless required by profiling.

## Decision 8: Offline durability baseline
- Decision: Implement queued write intent for confirmed workout actions during transient connectivity loss, auto-synced on reconnect while preserving timestamp/order.
- Rationale: Aligns with FR-013 and NFR reliability goals (no workout data loss under normal intermittent conditions).
- Alternatives considered:
  - Block offline logging: rejected as poor gym usability.
  - Cache-only with manual retries: rejected due to error-prone UX.

## Decision 9: Testing layering for TanStack routes and workflows
- Decision: Use three-layer tests: unit (metrics/conversion/security utilities), integration (server function + route data boundaries), e2e (Playwright critical journeys and regressions).
- Rationale: Constitution requires test-gated reliability across all three levels.
- Alternatives considered:
  - E2E-only strategy: rejected for slow feedback and poor fault localization.
  - Unit-only strategy: rejected for missing route wiring/regression guarantees.
