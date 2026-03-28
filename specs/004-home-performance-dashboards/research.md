# Phase 0 Research: Home Performance Dashboards

## Decision 1: Reuse existing Recharts dashboard implementation
- Decision: Continue using the existing Recharts `AreaChart` implementation in `src/routes/__index/_layout.index.tsx` as the baseline and evolve it for requirement completeness.
- Rationale: This route already renders movement and nutrition trend charts with selectors and date range controls, so extending it minimizes churn and keeps UI consistency.
- Alternatives considered:
  - Introduce a new charting library: rejected due to unnecessary migration risk and duplicate styling effort.
  - Rebuild dashboard route from scratch: rejected because existing work already satisfies core rendering behavior.

## Decision 2: Keep metric aggregation on the server in existing feature modules
- Decision: Use `getProgressionSeriesServerFn` for movement metrics and `getNutritionHistoryServerFn` for nutrition points; only perform display transformation in the route.
- Rationale: Existing server functions are auth-protected, user-scoped, and already implement core metric aggregation, including timezone-aware day bucketing for progression.
- Alternatives considered:
  - Compute aggregation in the client: rejected for boundary violations and inconsistent results risk.
  - Add a brand-new dashboard aggregate endpoint for MVP: rejected because current contracts are sufficient for v1.

## Decision 3: Chart preference persistence stays session-scoped via route/search state
- Decision: Represent chart preferences (movement, movement metric, nutrition metric, date range) as route/search or component session state, not a new persisted database entity for MVP.
- Rationale: FR-013/FR-014 and user story requirements only require same-session continuity; adding DB persistence would expand scope with limited MVP value.
- Alternatives considered:
  - New `DashboardChartPreference` Prisma model: rejected as over-scoped for current acceptance criteria.
  - Browser localStorage-only persistence: rejected as less transparent/testable than route-state-first handling.

## Decision 4: Unit and display consistency policy
- Decision: Preserve canonical metric units in series payloads and apply explicit label/unit mapping in chart titles, axis labels, tooltip formatter, and latest-value cards.
- Rationale: Prevents ambiguity (FR-012), avoids mixed-unit misreads, and aligns with existing utility formatting patterns.
- Alternatives considered:
  - Unit-free chart values: rejected because interpretation errors increase.
  - Derive unit strings ad hoc in each JSX block: rejected due to DRY violations.

## Decision 5: Sparse-data handling strategy
- Decision: Keep daily points sparse (no synthetic gap filling), filter null metric points where required (for bodyweight), and show explicit empty states for no-result ranges.
- Rationale: Matches existing nutrition history behavior and keeps rendered trends truthful to recorded data.
- Alternatives considered:
  - Fill missing days with zeroes: rejected because this can falsely imply training/nutrition events.
  - Interpolate missing values: rejected for misleading trend interpretation in MVP.

## Decision 6: Test strategy for constitution compliance
- Decision: Add layered tests:
  - unit tests for dashboard metric label/unit mapping and chart-point transformation helpers,
  - integration tests for route filter/search state and query-driven rendering behavior,
  - Playwright tests for user-visible movement/nutrition chart interactions and empty states.
- Rationale: Meets constitution principle V and protects regressions in the highest-value dashboard journey.
- Alternatives considered:
  - E2E-only tests: rejected due to slow feedback and poor fault isolation.
  - Unit-only tests: rejected because route/query integration risk would remain uncovered.
