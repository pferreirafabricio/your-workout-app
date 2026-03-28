<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
	- V. Test-Gated Reliability -> V. Test-Gated Reliability Across Unit, Integration, and E2E
- Added sections:
	- None
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ✅ reviewed (no files present): .specify/templates/commands/*.md
- Runtime guidance reviewed:
	- ✅ reviewed (no change required): README.md
- Follow-up TODOs:
	- None
-->

# Better Bookkeeping Demo App Constitution

## Core Principles

### I. DRY, KISS, SOLID as Non-Negotiable Design Rules
All production code MUST follow DRY, KISS, and SOLID. Duplicate logic across routes,
components, and server functions MUST be refactored into reusable modules. New abstractions
MUST solve a concrete repeated problem, not speculative design.
Rationale: keeps implementation simple, maintainable, and scalable as features grow.

### II. Layered Boundaries and Strict Type Contracts
Business rules MUST live in server and library layers, not in route handlers or presentation
components. Routes and UI components MUST remain orchestration-only and side-effect minimal.
All boundary inputs and outputs MUST be explicitly typed and validated.
Rationale: preserves separation of concerns and prevents fragile cross-layer coupling.

### III. Data Integrity and Query Efficiency
Prisma schema and migrations MUST be the single source of truth for data model changes.
Features that compute history or progression metrics MUST produce correct time-series results
and use query patterns that are explainable and efficient. Complex optimization is permitted
only with measured evidence.
Rationale: protects data correctness while preventing unnecessary complexity.

### IV. Security-First Authentication and Validation
Passwords MUST be stored only as strong adaptive hashes and verified using constant-time
safe library methods. Plaintext passwords and reversible storage are prohibited. Server-side
validation is mandatory for all mutation inputs, and sensitive data exposure MUST be minimized.
Rationale: reduces risk of credential compromise and insecure data handling.

### V. Test-Gated Reliability Across Unit, Integration, and E2E
All feature work MUST include a test strategy covering unit tests for business logic,
integration tests for route/data boundaries where feasible, and end-to-end tests for
critical user journeys. Critical CRUD paths for movements, sets, and workouts MUST have
Playwright coverage. Regression tests MUST exist for body-weight defaulting and progression
metrics (max weight, total reps, total volume). For TanStack Router route behavior,
integration testing SHOULD follow the official setup guidance from
https://tanstack.com/router/latest/docs/how-to/setup-testing when applicable.
Rationale: layered testing catches defects earlier and protects end-user behavior in CI.

### VI. Incremental Delivery Discipline
Every change MUST map to explicit requirements, remain small enough for focused review,
and use Conventional Commits. Pull requests MUST document notable tradeoffs when complexity
is introduced.
Rationale: improves review quality, traceability, and long-term velocity.

## Technical Standards

- Stack constraints: TanStack Start, TanStack Router, TanStack Query, TanStack Form,
	Prisma with PostgreSQL, Bun runtime, Playwright e2e.
- TypeScript strictness MUST remain enabled; type safety regressions are prohibited.
- Feature work MUST preserve route-level performance and correctness for workout and
	progression data workflows.

## Workflow and Quality Gates

- Specification MUST define independent user scenarios and measurable acceptance criteria.
- Plan MUST pass a constitution check before implementation begins.
- Tasks MUST include test work for critical behavior and security-sensitive flows.
- Tasks MUST include unit tests and integration tests where feasible, not only e2e checks.
- Merges require: passing CI, required tests, and reviewer confirmation of constitution
	compliance.

## Governance

This constitution overrides conflicting local practices for implementation and review.
Amendments require a pull request that includes: proposed text changes, rationale,
impact analysis, and required template updates.

Versioning policy:
- MAJOR for backward-incompatible governance changes or principle removals/redefinitions.
- MINOR for new principles/sections or materially expanded obligations.
- PATCH for clarifications and non-semantic wording improvements.

Compliance review policy:
- Each plan MUST include a constitution gate.
- Each pull request MUST include an explicit compliance check.
- Exceptions MUST be time-boxed, documented, and approved by maintainers.

**Version**: 1.1.0 | **Ratified**: 2026-03-27 | **Last Amended**: 2026-03-28
