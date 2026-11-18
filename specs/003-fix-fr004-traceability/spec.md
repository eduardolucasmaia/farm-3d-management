---
spec_id: 003-fix-fr004-traceability
status: draft
---

# Feature Specification: Fix FR-004 traceability gap

**Feature Branch**: `003-fix-fr004-traceability`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "We need to create features to solve this error: ERROR SDD004  `FR-004` appears in spec.md but in neither plan.md nor tasks.m"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Audit team verifies FR-004 is traceable through all artifacts (Priority: P1)

An auditor (or team member) reviews the feature `001-reimplementar-printfarm` spec artifacts. FR-004 is defined in `spec.md` but is absent from the Constitution Check table in `plan.md` and not explicitly referenced by any task ID in `tasks.md`. The fix must add FR-004 to both places, closing the traceability gap without altering any functional requirements or acceptance criteria of feature `001`.

**Why this priority**: Unresolved SDD004 warnings block merging. Every FR-xxx defined in `spec.md` must be cross-referenced in both the Constitution Check table and at least one task.

**Independent Test**: Run the spec-quality checks on `specs/001-reimplementar-printfarm/`. Verify that FR-004 has a row in the Constitution Check table of `plan.md` and is explicitly referenced by at least one task ID in `tasks.md`.

**Acceptance Scenarios**:

1. **Given** the Constitution Check table in `plan.md` has no row referencing FR-004, **When** the audit script checks that every FR-001…FR-026 is listed in the table, **Then** the scan fails because FR-004 is missing from the cross-reference.

2. **Given** `tasks.md` has no task that explicitly references FR-004 by ID, **When** the audit script checks that FR-004 is referenced by at least one task ID, **Then** the scan fails because the traceability link is missing.

3. **Given** the Constitution Check table in `plan.md` now includes a row for FR-004, **When** the audit script checks that every FR-001…FR-026 has a corresponding row, **Then** the scan passes.

4. **Given** tasks in `tasks.md` now include `[FR-004]` in their descriptions, **When** the audit script checks FR-004 traceability, **Then** the scan passes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST add a Constitution Check row for FR-004 in `plan.md`'s Constitution Check table, linking to the spec.md line where FR-004 is defined (line 217).
- **FR-002**: The system MUST add FR-004 cross-references to `tasks.md`, specifically tagging tasks that implement the FR-004 validation rules (model selling price distinct from cost, production profile with positive pieces/minutes/grams per plate).
- **FR-003**: After all edits, `plan.md` MUST contain every FR-001 through FR-026 as a row in the Constitution Check table (no gaps).
- **FR-004**: After all edits, `tasks.md` MUST reference FR-004 by ID in at least one task description.
- **FR-005**: The edits MUST NOT alter any functional requirement, acceptance criterion, or user story in feature `001`'s `spec.md` or `data-model.md`. Only `plan.md` and `tasks.md` are modified.

### Key Entities

- **SDD Warning**: An unresolved design finding, tracked by ID (e.g., FR-004), with severity, status (open/resolved), and encaminhamento (action to resolve).
- **Constitution Check Table**: A table in `plan.md` that cross-references each functional requirement (FR-xxx) to implementation tasks and design artifacts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every FR-001 through FR-026 has a corresponding entry in the Constitution Check table of `plan.md` (scan finds 26 FR-xxx references in the table).
- **SC-002**: FR-004 is referenced by at least one task ID in `tasks.md` (scan finds ≥1 match for "FR-004" in task lines).
- **SC-003**: No file within `specs/001-reimplementar-printfarm/` is modified except `plan.md` and `tasks.md` (git diff confirms exactly these two files changed).

## Assumptions

- FR-004's validation rules (model selling price distinct from cost; production profile pieces/minutes/grams per plate > 0) are already implemented in `master-data-rules.ts` (task T032), but the task description does not explicitly tag `[FR-004]`. This feature adds the tag to the correct task(s).
- The Constitution Check table in `plan.md` already has rows for all FR-004 through FR-026 except FR-004 itself (FR-003 was added in the prior feature `002`). Only FR-004 needs to be added.
- The branch `003-fix-fr004-traceability` will be merged into the default branch after the spec passes quality validation.
