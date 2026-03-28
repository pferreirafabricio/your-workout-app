# Feature Specification: Workout Progression Insights

**Feature Branch**: `001-workout-progression-insights`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "Workout Tracking App - progression-focused, insight-driven product expansion"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Workout Logging (Priority: P1)

As an athlete, I can start a workout, add movements, and log sets quickly with minimal taps so I can stay focused on training.

**Why this priority**: Logging speed is the primary day-to-day value driver. If logging is slow, users will abandon tracking.

**Independent Test**: Can be tested by completing a full workout session from start to finish and confirming the workout and sets are saved and viewable.

**Test Coverage Notes**: Unit tests for set validation and derived per-set metrics; integration tests for workout session save/retrieve boundaries; e2e test for start workout -> add movements -> log/edit/delete sets -> complete workout.

**Acceptance Scenarios**:

1. **Given** an authenticated user with existing movements, **When** they start a workout and log multiple sets, **Then** all entries are saved in the same workout session and shown immediately.
2. **Given** a logged set, **When** the user edits reps, weight, or notes inline, **Then** the updated values are persisted and reflected in workout totals.
3. **Given** a set was entered by mistake, **When** the user deletes the set, **Then** workout metrics and movement summaries recalculate correctly.

---

### User Story 2 - Bodyweight-Aware Tracking and Unit Preference (Priority: P1)

As an athlete, I can track both weighted and bodyweight movements and use my preferred weight unit so logs are accurate and intuitive.

**Why this priority**: Mixed training styles and unit preferences are core usability needs and directly impact data correctness.

**Independent Test**: Can be tested by logging one weighted movement and one bodyweight movement while switching unit preference and validating consistent values in input, display, and history.

**Test Coverage Notes**: Unit tests for conversion consistency and bodyweight auto-fill behavior; integration tests for preference persistence across sessions; e2e test for unit switch and cross-screen value consistency.

**Acceptance Scenarios**:

1. **Given** a movement flagged as bodyweight and at least one body weight entry exists, **When** the user logs a set, **Then** weight defaults to the most recent body weight and remains editable.
2. **Given** a user changes preferred unit, **When** they view logging screens and workout history, **Then** all displayed and entered weight values use the selected unit consistently.
3. **Given** no body weight entry exists for a bodyweight movement, **When** the user attempts to log a set, **Then** the system prompts for body weight input before completing the log.

---

### User Story 3 - Rest Timing and Immediate Feedback (Priority: P2)

As an athlete, I can track rest duration between sets and compare it to my target rest so I can maintain training quality.

**Why this priority**: Rest control is a major training variable that improves workout quality but is secondary to core logging.

**Independent Test**: Can be tested by logging consecutive sets for the same movement and confirming timer start/reset behavior plus target-rest feedback.

**Test Coverage Notes**: Unit tests for elapsed-time and reset rules; integration tests for timer state across set events; e2e test for set completion triggering rest timer and next-set reset.

**Acceptance Scenarios**:

1. **Given** a set is completed, **When** the set is saved, **Then** a rest timer starts and displays elapsed rest time from the set timestamp.
2. **Given** a rest target is configured, **When** elapsed rest reaches or exceeds the target, **Then** the interface clearly indicates target reached.
3. **Given** the user logs the next set, **When** the set is confirmed, **Then** the previous rest timer resets and a new rest cycle begins.

---

### User Story 4 - Progression and History Insights (Priority: P2)

As an athlete, I can review movement trends and body weight history to understand progression over time.

**Why this priority**: Insight visibility is the core differentiator of this product evolution and reinforces consistency.

**Independent Test**: Can be tested by logging workouts over multiple dates and verifying trend views for max weight, reps, volume, and body weight.

**Test Coverage Notes**: Unit tests for aggregate calculations (volume, max weight, totals); integration tests for time-range and movement filters; e2e test for selecting a movement metric and viewing accurate trend data.

**Acceptance Scenarios**:

1. **Given** historical workout data exists, **When** a user selects a movement and metric, **Then** a chronological trend view is displayed with correct values per day.
2. **Given** body weight entries exist across dates, **When** the user opens body weight history, **Then** a chronological weight trend is shown.
3. **Given** a workout has multiple movements and sets, **When** the workout is completed, **Then** total workout volume is available in history and detail views.

---

### User Story 5 - Account and Data Protection Foundations (Priority: P3)

As a user, I can trust that my account credentials and workout data are protected by baseline security controls.

**Why this priority**: Security is essential for production readiness but does not change the primary workout workflow.

**Independent Test**: Can be tested by creating accounts, attempting repeated failed sign-ins, and submitting invalid inputs to verify secure handling and safe session behavior.

**Test Coverage Notes**: Unit tests for credential handling and input validation rules; integration tests for session lifecycle and request protections; e2e test for sign-in success/failure paths and account protection behavior.

**Acceptance Scenarios**:

1. **Given** a user creates or updates credentials, **When** credentials are stored, **Then** plaintext passwords are never stored or exposed.
2. **Given** repeated failed sign-in attempts from the same source, **When** the threshold is exceeded, **Then** additional attempts are temporarily constrained.
3. **Given** a session is active, **When** requests are made to protected actions, **Then** only valid authenticated sessions can complete those actions.

### Edge Cases

- User starts a workout offline or with unstable connectivity and reconnects before completion.
- User logs sets rapidly in succession; timer and timestamps remain correct and non-duplicative.
- User switches preferred units after historical data already exists; historical trends remain equivalent after conversion.
- Bodyweight movement is logged on a date with no prior body weight entry.
- Duplicate or near-duplicate movement names are created (for example, case differences).
- User edits or deletes a historical set; all impacted aggregates recalculate consistently.
- Extremely large values or clearly invalid values are entered for reps, weight, or body weight.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create, edit, and delete reusable movements with movement type, default unit, and optional categorization metadata.
- **FR-002**: System MUST allow users to start, update, and complete workouts that contain multiple movements and sets.
- **FR-003**: System MUST support inline create, update, and delete of sets within an active workout flow.
- **FR-004**: System MUST record set-level fields including reps, weight, and timestamp, with optional effort rating and notes.
- **FR-005**: System MUST automatically calculate workout duration based on recorded workout timing.
- **FR-006**: System MUST support bodyweight movements where logged weight defaults to the user's latest recorded body weight.
- **FR-007**: System MUST allow users to record body weight entries over time and review historical body weight trends.
- **FR-008**: System MUST provide per-user weight unit preference and apply conversions consistently in entry, display, and history contexts.
- **FR-009**: System MUST start and display a rest timer after set completion and reset it when the next set is logged.
- **FR-010**: System MUST allow users to define an optional rest target and clearly indicate when the target is reached.
- **FR-011**: System MUST compute and store derived metrics: set volume, workout total volume, and daily movement max weight.
- **FR-012**: System MUST provide history views that allow users to select a movement and metric to visualize progression over time.
- **FR-013**: System MUST ensure workout and set updates are durable so users do not lose confirmed workout data during normal use.
- **FR-014**: System MUST protect account credentials so plaintext passwords are never stored.
- **FR-015**: System MUST apply baseline account and session protections including sign-in abuse controls, request authenticity protection, and input validation.
- **FR-016**: System MUST support test coverage for movement, set, workout, bodyweight behavior, and rest-timer workflows at unit, integration, and end-to-end levels.
- **FR-017**: System MUST provide a mobile-friendly logging experience where core actions remain usable on small screens.
- **FR-018**: System SHOULD provide optional progression features in future phases, including estimated one-rep max, nutrition context, advanced summaries, and personal-record cues.

### Key Entities *(include if feature involves data)*

- **Movement**: Reusable exercise definition with name, movement type (weighted/bodyweight), default unit, and optional muscle group/equipment metadata.
- **Workout**: Training session with date, optional title, movement entries, set collection, and derived duration/summary metrics.
- **Set Entry**: Atomic performance log containing reps, weight, timestamp, optional effort rating, and optional notes.
- **Body Weight Entry**: Time-based record of user body weight and measurement unit used for context and defaults.
- **User Preference**: Per-user settings including preferred weight unit and optional rest-target defaults.
- **Progress Snapshot**: Derived metric view for movement/day combinations, including max weight, total reps, and volume.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of users can complete a standard workout log (start workout, add movement, log at least three sets, complete workout) in 3 minutes or less.
- **SC-002**: At least 95% of logged sets are saved successfully on first attempt without user re-entry.
- **SC-003**: At least 95% of history and progression views load within 2 seconds for users with up to one year of workout data.
- **SC-004**: At least 80% of active users view progression or body weight trends at least once per week.
- **SC-005**: At least 70% of users who train for 4 consecutive weeks return in week 5.
- **SC-006**: Security audit confirms zero cases of plaintext password storage and no unresolved critical account/session protection gaps at release readiness.

## Assumptions

- Primary users are individual athletes tracking their own workouts, not coaches managing multiple athletes in this release.
- The first release focuses on reliable logging, progression insights, unit handling, and core security hardening; admin dashboards are out of scope.
- Nutrition tracking, advanced analytics summaries, templates, and smart suggestions are planned as later phases unless explicitly promoted.
- Users may train in environments with intermittent connectivity, but confirmed entries should persist once connection is available.
- Existing authentication and workout data can be extended without requiring users to recreate historical records.
- Regulatory or medical-grade reporting requirements are not in scope for this release.
