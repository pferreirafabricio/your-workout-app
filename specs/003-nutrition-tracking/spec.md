# Feature Specification: Nutrition Tracking

**Feature Branch**: `[003-nutrition-tracking]`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "Add nutrition tracking that supports fast daily food logging, macro and calorie balance tracking, historical trends, and correlation with body weight and workout performance."

## Clarifications

### Session 2026-03-28

- Q: How should the system handle mismatch between entered calories and macro-derived calories? → A: Keep entered calories, show mismatch warning, and use macro-derived calories as canonical for balance and analytics.
- Q: How should the system behave when nutrition goals are missing? → A: Allow logging without goals; show consumed calories/macros, and hide remaining/surplus-deficit until goals are set with a clear prompt.
- Q: Which day boundary should define daily nutrition logs? → A: Use each user’s local timezone day boundaries, while storing canonical timestamps in UTC.
- Q: Should weekly averages be part of MVP? → A: No. Weekly averages are deferred to a later phase and excluded from MVP scope.
- Q: How should concurrent edits to the same food entry be handled? → A: Use last-write-wins per food entry, show a non-blocking conflict notice, and refresh affected totals.

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

### User Story 1 - Log Daily Nutrition Quickly (Priority: P1)

As a user, I can add, edit, and delete food entries in my daily log so that I can track nutrition intake with minimal friction.

**Why this priority**: Fast and reliable logging is the foundation for all nutrition insights; without complete input data, summaries and trends are not useful.

**Independent Test**: Can be fully tested by creating a daily log, adding multiple food entries, editing one entry, and deleting one entry while confirming totals update correctly and the flow remains usable on its own.

**Test Coverage Notes**: Unit tests for calorie/macro calculations and inline edit/delete behavior; integration tests for daily log totals recalculation after create/update/delete operations; e2e validation of logging speed, inline editing, and persistence.

**Acceptance Scenarios**:

1. **Given** a user opens today’s nutrition log, **When** they add a food entry with quantity and macros, **Then** the entry is saved and daily totals update immediately.
2. **Given** a food entry exists, **When** the user edits quantity or macros, **Then** the entry updates inline and totals recalculate immediately.
3. **Given** a food entry exists, **When** the user deletes it, **Then** it is removed from the day and totals are reduced accordingly.

---

### User Story 2 - Understand Daily Calorie Balance (Priority: P2)

As a user, I can view consumed calories, remaining calories, macro progress, and surplus or deficit status so that I can make same-day dietary decisions.

**Why this priority**: Daily decision support is the primary user value beyond logging and is required to support cut, maintenance, and bulk goals.

**Independent Test**: Can be fully tested by setting nutrition goals, entering foods to cross under/over target states, and validating summary values, progress indicators, and balance labels.

**Test Coverage Notes**: Unit tests for balance and macro percentage formulas; integration tests for goal-to-summary comparisons and state transitions (under target, on target, over target); e2e validation that users can identify remaining calories and macro progress at a glance.

**Acceptance Scenarios**:

1. **Given** daily goals are set, **When** consumed calories are below target, **Then** the summary shows remaining calories and deficit status clearly.
2. **Given** daily goals are set, **When** consumed calories exceed target, **Then** the summary shows surplus status clearly and updates in real time.
3. **Given** macro totals exist for the day, **When** the summary is viewed, **Then** both gram totals and macro calorie percentages are visible and accurate.

---

### User Story 3 - Review Historical Trends and Weight Correlation (Priority: P3)

As a user, I can review historical calories and macros over time and compare them with body weight changes so that I can evaluate whether my nutrition aligns with outcomes.

**Why this priority**: Trend visibility and cross-domain correlation create the “actionable insights” value and position the product as a full fitness system.

**Independent Test**: Can be fully tested by navigating past dates, viewing historical charts, and confirming users can compare nutrition trends with recorded body weight over the same time range.

**Test Coverage Notes**: Unit tests for daily trend aggregation; integration tests for historical date filtering and nutrition-to-weight time alignment; e2e validation of history navigation and chart readability.

**Acceptance Scenarios**:

1. **Given** historical nutrition logs exist, **When** the user opens history, **Then** daily calorie and macro trends are displayed for past days.
2. **Given** body weight data exists for overlapping dates, **When** the user enables correlation view, **Then** nutrition and weight data can be compared across the same timeline.

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when a user logs food with zero values for one or more macros?
- When macro-derived calories differ from manually entered calories for a food entry, preserve entered calories for display, show a clear mismatch warning, and use macro-derived calories for balance and analytics calculations.
- How does the system handle very large quantities or unusually high calorie totals in one day?
- How does the system handle edits on a previous day while the user is viewing today’s summary?
- When nutrition goals are missing, allow food logging and show consumed calories/macros, but hide remaining calories and surplus/deficit status until goals are configured, with a clear setup prompt.
- How does the system handle entries near midnight or timezone changes so food is attributed to the correct local day?
- How does the system handle concurrent edits to the same food entry from multiple sessions?
- How does the system handle partial data availability when nutrition data exists but weight records do not?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow users to create a daily nutrition log for any date.
- **FR-002**: System MUST allow users to add a food entry with name, quantity, protein grams, carb grams, fat grams, and calories.
- **FR-003**: System MUST allow users to edit and delete existing food entries inline from the daily log.
- **FR-004**: System MUST recalculate and display daily totals (calories, protein, carbs, fats) immediately after each entry add, edit, or delete action.
- **FR-005**: System MUST provide user-defined nutrition goals including daily calorie target, protein target, carb target, fat target, and goal type (cut, maintenance, bulk).
- **FR-006**: System MUST always display consumed calories for the selected day and MUST display remaining calories plus over/under target status when goals are configured.
- **FR-007**: System MUST compute and display calorie balance using consumed calories minus calorie target when goals are configured.
- **FR-008**: System MUST label positive calorie balance as surplus and negative calorie balance as deficit.
- **FR-009**: System MUST compute total calories from macros using: protein × 4 + carbs × 4 + fats × 9.
- **FR-010**: System MUST display macro totals in grams and macro distribution as percentages of total calories.
- **FR-011**: System MUST provide a daily summary view that makes calorie status and macro progress understandable at a glance.
- **FR-012**: System MUST provide a historical nutrition view for past days including calorie trend and macro trend visualizations.
- **FR-013**: System MUST allow users to compare nutrition trend data with body weight records over the same date range when both are available.
- **FR-014**: System MUST preserve user nutrition logs reliably so entries remain available across sessions.
- **FR-015**: System MUST support manual food entry as the MVP input method.
- **FR-016**: System MUST provide daily historical trends in MVP and MUST exclude weekly average metrics from MVP scope.
- **FR-017**: System SHOULD provide clear visual indicators for under target, on target, and over target daily status.
- **FR-018**: System MUST keep primary logging interactions efficient enough for a typical user to complete a single food entry in under 10 seconds under normal usage conditions.
- **FR-019**: System MUST preserve user-entered calorie values for each food entry, MUST warn users when entered calories do not match macro-derived calories, and MUST use macro-derived calories as the canonical value for daily balance and analytics.
- **FR-020**: System MUST allow nutrition logging when goals are not configured, MUST display consumed calories and macro totals, and MUST hide remaining calories and surplus/deficit outputs until goals are set.
- **FR-021**: System MUST provide a clear prompt to configure nutrition goals whenever a user views goal-dependent metrics without configured targets.
- **FR-022**: System MUST assign and present daily nutrition logs using each user’s local timezone day boundary (midnight to midnight local time) while storing event timestamps in UTC for consistency.
- **FR-023**: System MUST resolve concurrent updates to the same food entry using last-write-wins behavior, MUST display a non-blocking conflict notice to impacted sessions, and MUST refresh daily totals after conflict resolution.

### Key Entities *(include if feature involves data)*

- **Daily Nutrition Log**: Represents all nutrition data for one user on one date; includes date, total calories, total protein/carbs/fats, calorie balance, and goal comparison state.
- **Food Entry**: Represents a single logged item in a day; includes item name, quantity, macro values, calorie value, and linkage to a daily log.
- **Nutrition Goals**: Represents user-defined targets; includes calorie target, protein target, carb target, fat target, and goal type (cut, maintenance, bulk).
- **Historical Nutrition Snapshot**: Represents aggregated daily data used for trend views; includes date-level totals and macro distribution.
- **Body Weight Record (Existing Domain Entity)**: Represents body weight on a date and is used for timeline correlation with nutrition history.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: At least 90% of users can log a standard food entry in 10 seconds or less.
- **SC-002**: At least 95% of daily summary updates (totals, balance, and status) are visible to users within 1 second of entry changes.
- **SC-003**: At least 90% of users can correctly identify whether they are in surplus or deficit from the daily summary without additional navigation.
- **SC-004**: At least 80% of active users record nutrition data on 5 or more days within a 14-day period after first use of the feature.
- **SC-005**: At least 70% of users who track both nutrition and body weight can access a valid combined trend view over a selected date range without missing-date errors.

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- Users already have authenticated accounts and access to existing body weight tracking capabilities.
- Manual food entry is the only required input method for the first release; saved and recent foods are deferred.
- Meal-level structuring (breakfast/lunch/dinner/snacks) is out of scope for the first release.
- Weekly average metrics are out of scope for MVP and will be considered in a later phase.
- Historical views rely on users having at least one prior day of logged nutrition data.
- Correlation insights are limited to comparative visualization in this release; automated recommendation logic is deferred.
- Existing workout performance tracking remains unchanged but is considered downstream context for future nutrition-performance insights.
