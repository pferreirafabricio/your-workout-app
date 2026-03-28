# Phase 0 Research: Nutrition Tracking

## Decision 1: Canonical calorie strategy for analytics and balance
- Decision: Preserve user-entered calories on each food entry for display/editing, but compute canonical totals and balance from macro-derived calories (`protein*4 + carbs*4 + fats*9`) and show a mismatch warning when values differ.
- Rationale: Aligns with clarified product behavior, keeps user trust in what they entered, and prevents drift in aggregate analytics.
- Alternatives considered:
  - Force overwrite entered calories with macro-derived values: rejected because it discards user-provided label values.
  - Use entered calories as canonical analytics input: rejected because it can break macro-calorie consistency.

## Decision 2: Goal-dependent summary behavior
- Decision: Allow logging with no configured goals, always show consumed calories/macros, and hide remaining/surplus-deficit metrics until goals are configured with a clear setup prompt.
- Rationale: Reduces onboarding friction while avoiding misleading guidance when targets are absent.
- Alternatives considered:
  - Require goals before any logging: rejected due to high friction for first use.
  - Auto-assign default calorie goals: rejected because defaults can be misleading and not user-specific.

## Decision 3: Day-boundary and timestamp policy
- Decision: Store timestamps in UTC while assigning and rendering daily logs by each user’s local timezone day boundary.
- Rationale: Ensures cross-system consistency while matching user expectations for date-based nutrition logging.
- Alternatives considered:
  - UTC-only day bucketing: rejected because user-visible day attribution becomes unintuitive near midnight.
  - Server-timezone bucketing: rejected for multi-timezone correctness.

## Decision 4: Concurrent mutation handling
- Decision: Use last-write-wins per food entry, emit a non-blocking conflict notice to impacted sessions, and refresh affected totals.
- Rationale: Predictable MVP conflict semantics with low UX friction and clear data freshness behavior.
- Alternatives considered:
  - Hard edit locks: rejected due to collaboration friction and stale locks.
  - Mandatory merge dialogs: rejected as unnecessary complexity for MVP.

## Decision 5: MVP historical scope
- Decision: Include daily nutrition history and macro/calorie trends in MVP, and explicitly defer weekly average metrics.
- Rationale: Keeps scope focused on core user value and agreed clarifications while preserving a clear extension path.
- Alternatives considered:
  - Include weekly averages in MVP: rejected due to scope growth and additional UX/aggregation complexity.

## Decision 6: Integration approach with existing body weight domain
- Decision: Reuse existing body-weight series retrieval patterns to align nutrition history and weight history by local-day date keys for overlay/correlation views.
- Rationale: Uses proven query pathways and minimizes domain duplication.
- Alternatives considered:
  - Build separate body-weight aggregation paths for nutrition: rejected due to DRY violations and maintenance overhead.

## Decision 7: Validation and mutation boundaries
- Decision: Introduce nutrition-specific Zod schemas for create/update/delete food entries, goals upsert, and date-range history queries; enforce validation in server functions and mirror client-side for fast feedback.
- Rationale: Preserves existing security and type-safety conventions and supports fast form interactions.
- Alternatives considered:
  - Server-only validation: rejected because immediate UX feedback is needed.
  - Client-only validation: rejected due to security/integrity risk.

## Decision 8: Testing strategy aligned with constitution
- Decision: Add unit tests for calorie/macro/balance/day-bucketing logic, integration tests for route/query/mutation boundaries and invalidation, and e2e tests for daily logging, goal-aware summary behavior, and historical correlation rendering.
- Rationale: Meets constitution gate requirements and protects against regressions in critical user journeys.
- Alternatives considered:
  - E2E-only strategy: rejected due to slow feedback and weaker fault localization.
  - Unit-only strategy: rejected due to insufficient confidence in routing/data integration.
