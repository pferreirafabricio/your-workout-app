# Feature Specification: Home Performance Dashboards

**Feature Branch**: `004-home-performance-dashboards`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "create home dashboards to implement a chart where a user can select a movement and a corresponding metric and see that metric plotted against time. Metrics: maximum weight (the maximum weight for that movement on a given day) total reps total volume (volume of a set is weight * reps, total volume for a movement is total volume of all sets in a workout) also think in charts for the nutrition module as well"

## User Scenarios & Testing *(mandatory)*

Every user story MUST identify how unit, integration, and end-to-end coverage will be
achieved for the behavior in scope. Integration tests SHOULD be included where feasible,
especially for route/data boundaries.

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Track Movement Progress Over Time (Priority: P1)

As a lifter viewing the home dashboard, I can choose a movement and one movement metric so I can immediately see how that metric trends over time.

**Why this priority**: This is the core request and highest-value insight for training progression.

**Independent Test**: Can be fully tested by selecting a movement, switching among all supported movement metrics, and confirming the plotted values and dates match recorded workouts.

**Test Coverage Notes**: Unit tests for metric aggregation formulas and chart series transformation; integration tests for dashboard data loading and filter state interactions; e2e test for selecting movement + metric and validating visible plotted timeline points.

**Acceptance Scenarios**:

1. **Given** a user has workout history for multiple movements, **When** they select one movement and "maximum weight", **Then** the chart shows one point per day using the highest logged set weight for that movement on each day.
2. **Given** a user is viewing a movement chart, **When** they switch the metric from "maximum weight" to "total reps" or "total volume", **Then** the chart updates to the selected metric over the same date axis.
3. **Given** a user has no history for a selected movement in the current range, **When** the chart loads, **Then** the dashboard shows an empty-state message with guidance to log workouts.

---

### User Story 2 - Compare Nutrition Trends On Home Dashboard (Priority: P2)

As a user tracking nutrition, I can view nutrition trend charts on the home dashboard so I can understand how eating behavior and bodyweight change over time.

**Why this priority**: Nutrition visibility complements training visibility and supports behavior change without leaving the dashboard.

**Independent Test**: Can be tested independently by loading the nutrition dashboard cards and switching nutrition metrics to verify trend rendering and empty-state behavior.

**Test Coverage Notes**: Unit tests for daily nutrition aggregation and moving-average calculations (if displayed); integration tests for nutrition chart metric selector + date range interactions; e2e test for loading nutrition chart, switching metrics, and confirming expected points are shown.

**Acceptance Scenarios**:

1. **Given** a user has nutrition entries across multiple days, **When** they open the home dashboard, **Then** at least one nutrition trend chart is visible and populated.
2. **Given** a user selects a different nutrition metric (for example calories, protein, or bodyweight), **When** the selection changes, **Then** the chart updates to the chosen metric over time.
3. **Given** nutrition entries are missing for some days, **When** the chart renders, **Then** missing days are handled consistently and do not break chart interaction.

---

### User Story 3 - Keep Dashboard Interactions Understandable (Priority: P3)

As a user reviewing charted trends, I can clearly understand what metric and time range I am looking at so I can make decisions confidently.

**Why this priority**: Clarity reduces misinterpretation of training and nutrition trends.

**Independent Test**: Can be tested independently by verifying chart labels, legends, and units after each metric selection.

**Test Coverage Notes**: Unit tests for metric label/unit mapping; integration tests for persistence of selected metric per chart session; e2e checks for chart titles, axis labels, and tooltip readability.

**Acceptance Scenarios**:

1. **Given** a user selects any movement or nutrition metric, **When** the chart is displayed, **Then** the chart title and axis labels clearly indicate the selected metric and its unit.
2. **Given** a user changes filters and navigates within the dashboard, **When** they return to the chart area in the same session, **Then** the last selected metric remains selected.

---

### Edge Cases

- Multiple workouts for the same movement on one day: "maximum weight" uses the highest single set weight that day; "total reps" and "total volume" sum all qualifying sets for that day.
- Workouts containing warm-up sets and working sets: only sets already counted by existing workout analytics rules are included to avoid double standards.
- Unit consistency: when users log different weight units over time, values shown within one chart follow the user’s active display unit and historical values are normalized before plotting.
- Sparse data: large date ranges with few entries still render readable charts and do not appear as errors.
- Invalid or deleted movement references in historical sets are excluded from movement metric charts and logged for diagnostics.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home dashboard MUST provide a movement performance chart module with controls for selecting a movement and one movement metric.
- **FR-002**: The movement metric selector MUST support exactly these metrics for v1: maximum weight, total reps, and total volume.
- **FR-003**: For movement charts, the system MUST aggregate values by calendar day for the selected movement.
- **FR-004**: Maximum weight MUST be calculated as the highest set weight logged for the selected movement on each day.
- **FR-005**: Total reps MUST be calculated as the sum of reps across all sets logged for the selected movement on each day.
- **FR-006**: Total volume MUST be calculated as the sum of weight multiplied by reps across all sets logged for the selected movement on each day.
- **FR-007**: The chart MUST plot aggregated daily values against time in chronological order and provide readable date/value tooltips.
- **FR-008**: The dashboard MUST include nutrition trend charting on the home dashboard with a nutrition metric selector.
- **FR-009**: The nutrition metric selector MUST support at least daily calories, daily protein, and bodyweight trend in v1.
- **FR-010**: Both movement and nutrition charts MUST support a user-selectable date range filter.
- **FR-011**: If no data exists for a selected chart configuration, the dashboard MUST show a non-error empty state describing how to generate data.
- **FR-012**: Chart labels, legends, and tooltips MUST clearly identify the selected metric and unit.
- **FR-013**: Dashboard chart interactions MUST only show data belonging to the signed-in user.
- **FR-014**: The system MUST update chart data within the same session after new workouts or nutrition logs are recorded and the dashboard is revisited or refreshed.

### Key Entities *(include if feature involves data)*

- **Movement Daily Metric Point**: A daily aggregate for one movement and one metric, including movement identifier, metric type, date, aggregated value, and display unit.
- **Nutrition Daily Metric Point**: A daily aggregate for one nutrition metric, including metric type, date, aggregated value, and display unit.
- **Dashboard Chart Preference**: Per-user selection state for chart filters, including selected movement, selected metrics, and chosen date range.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users with at least 30 days of workout data can render a movement chart for any supported metric in under 3 seconds from dashboard load.
- **SC-002**: At least 90% of sampled daily chart points match expected values from source logs for maximum weight, total reps, and total volume calculations during acceptance validation.
- **SC-003**: At least 80% of active users who log workouts open a dashboard chart interaction (movement or nutrition metric change) at least once per week within 30 days of release.
- **SC-004**: In usability testing, at least 85% of participants correctly interpret whether their selected movement metric is trending up, down, or flat after viewing the chart for under 30 seconds.

## Assumptions


- Dashboard charts are available to authenticated users already using workout and nutrition logging in the app.
- Initial release targets responsive web use for both desktop and mobile viewport sizes.
- Existing movement, workout set, nutrition, and bodyweight data sources are reused as the source of truth for charted aggregates.
- Existing access-control behavior for user-owned data remains unchanged and is sufficient for this feature.
- For v1, nutrition charting focuses on trend visualization and does not include predictive or goal-gap forecasting.
