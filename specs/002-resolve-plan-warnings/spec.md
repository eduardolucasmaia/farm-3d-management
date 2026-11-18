---
spec_id: 002-resolve-plan-warnings
status: draft
---

# Feature Specification: Resolve warnings SDD003 and SDD004

**Feature Branch**: `002-resolve-plan-warnings`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Resolve warnings SDD003 unresolved placeholder [NEEDS CLARIFICATION] in plan.md and SDD004 FR-003 appears in spec.md but in neither plan.md nor tasks.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Audit team reviews spec artifacts and finds no unresolved warnings (Priority: P1)

An auditor (or team member) reviews all spec artifacts for the feature `001-reimplementar-printfarm`: `plan.md`, `data-model.md`, `tasks.md`, and `spec.md`. Every `[NEEDS CLARIFICATION]` tag is answered, every found item in `plan.md`'s analysis findings table has a resolved encaminhamento, and every functional requirement defined in `spec.md` is cross-referenced in the Constitution Check table of `plan.md` and in at least one task in `tasks.md`.

**Why this priority**: Unresolved warnings block merging. They represent open questions about the design and traceability gaps that make it impossible to verify that no requirement was dropped during implementation.

**Independent Test**: Run the spec-quality checks described below on `specs/001-reimplementar-printfarm/`. Verify that zero unresolved `[NEEDS CLARIFICATION]` tags remain in any artifact, that the Constitution Check table in `plan.md` contains every FR-xxx line, and that `tasks.md` references FR-003 by ID.

**Acceptance Scenarios**:

1. **Given** `data-model.md` line 143 still contains `[NEEDS CLARIFICATION: execução que falha também soma o tempo real às horas acumuladas? Achado A2 de analysis.md.]`, **When** the audit script scans for unresolved `[NEEDS CLARIFICATION]` markers, **Then** the scan fails because a warning remains open.

2. **Given** the Constitution Check table in `plan.md` has no row referencing FR-003, **When** the audit script checks that every FR-003…FR-026 is listed in the table, **Then** the scan fails because FR-003 is missing from the cross-reference.

3. **Given** `tasks.md` has no task that references FR-003, **When** the audit script checks that FR-003 is referenced by at least one task ID, **Then** the scan fails because the traceability link is missing.

4. **Given** A2 is answered in `data-model.md` with "Sim, execução que falha também soma o tempo real de impressão às horas acumuladas. AccumulatedSeconds é uma métrica da impressora, independente do estado do lote de produção.", **When** the audit script scans for unresolved markers in `data-model.md`, **Then** the scan finds no `[NEEDS CLARIFICATION]` tags and passes.

5. **Given** the Constitution Check table in `plan.md` now includes a row for FR-003, **When** the audit script checks that every FR-001…FR-026 has a corresponding row, **Then** the scan passes.

6. **Given** tasks T032–T038 in `tasks.md` now include FR-003 in their descriptions, **When** the audit script checks FR-003 traceability, **Then** the scan passes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST answer the A2 `[NEEDS CLARIFICATION]` tag in `data-model.md` line 143 with a definitive resolution about whether failed executions also accumulate real print time into the printer's AccumulatedSeconds.
- **FR-002**: The system MUST add a Constitution Check row for FR-003 in `plan.md`'s Constitution Check table, linking to the spec.md line where FR-003 is defined.
- **FR-003**: The system MUST add FR-003 cross-references to `tasks.md`, specifically in tasks T032–T038 (US2) which implement the operational base cadastros.
- **FR-004**: After all edits, `plan.md`, `data-model.md`, and `tasks.md` MUST contain zero unresolved `[NEEDS CLARIFICATION]` tags in the `001-reimplementar-printfarm` feature directory.
- **FR-005**: After all edits, every functional requirement (FR-001 through FR-026) defined in `spec.md` MUST be cross-referenced in both `plan.md`'s Constitution Check table and at least one task in `tasks.md`.

### Key Entities

- **SDD Warning**: An unresolved design finding, tracked by ID (e.g., A2, FR-003), with severity, status (open/resolved), and encaminhamento (action to resolve).
- **Constitution Check Table**: A table in `plan.md` that cross-references each functional requirement (FR-xxx) to implementation tasks and design artifacts.
- **Clarification Resolution**: A replacement of a `[NEEDS CLARIFICATION]` tag with a definitive answer, backed by context from the spec, data model, or other artifacts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero `[NEEDS CLARIFICATION]` tags remain in any file within `specs/001-reimplementar-printfarm/` (scan returns 0 matches).
- **SC-002**: Every FR-001 through FR-026 has a corresponding entry in the Constitution Check table of `plan.md` (scan finds 26 FR-xxx references in the table).
- **SC-003**: FR-003 is referenced by at least one task ID in `tasks.md` (scan finds ≥1 match for "FR-003" in task lines).
- **SC-004**: The A2 resolution in `data-model.md` states: "Sim, execução que falha também soma o tempo real de impressão às horas acumuladas. AccumulatedSeconds é uma métrica da impressora, independente do estado do lote de produção." (exact match in the line).

## Assumptions

- The A2 resolution is derived from context: FR-017's "uma única saída de estoque" and the printer state machine (Preparing → InMaintenance checks AccumulatedSeconds ≥ MaintenanceLimitHours × 3600) imply AccumulatedSeconds is a printer-level metric independent of lot state.
- T032–T038 (US2, "Manter a base da operação") are the correct tasks to add FR-003 references to, since they implement the cadastros that FR-003 defines.
- The Constitution Check table in `plan.md` already has rows for all FR-004 through FR-026; only FR-003 needs to be added.
- The branch `002-resolve-plan-warnings` will be merged into the default branch after the spec passes quality validation.
