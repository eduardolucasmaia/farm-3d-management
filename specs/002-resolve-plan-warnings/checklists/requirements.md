# Requirements Checklist: Resolve warnings SDD003 and SDD004

**Purpose**: Verify that the spec for resolving SDD003 and SDD004 is complete, consistent, and traceable before implementation begins.

**Created**: 2026-11-18

**Feature**: [specs/002-resolve-plan-warnings/spec.md](../spec.md)

---

## Completeness

- [ ] CHK001 All three warnings (A2 in data-model.md, FR-003 missing in plan.md Constitution Check, FR-003 missing in tasks.md) are explicitly addressed in the spec's Functional Requirements.
- [ ] CHK002 The A2 resolution answer is unambiguous and backed by a cited rationale (FR-017, printer state machine).
- [ ] CHK003 The spec includes the exact text that will replace the `[NEEDS CLARIFICATION]` tag in `data-model.md`.
- [ ] CHK003 [ ] CHK004 The Constitution Check row for FR-003 specifies the plan.md file and section where it will be added.
- [ ] CHK004 The tasks.md cross-references for FR-003 specify which task IDs (T032–T038) will be updated.

## Traceability

- [ ] CHK005 Every FR-001 through FR-026 from `spec.md` of feature 001 is accounted for in the spec's traceability discussion.
- [ ] CHK006 FR-003 is linked to specific implementation tasks (T032–T038) in the spec's requirements or success criteria.
- [ ] CHK007 The A2 finding is linked to its source: `data-model.md` line 143, `analysis.md` finding A2.

## Consistency

- [ ] CHK008 The A2 resolution ("failed executions also accumulate time") is consistent with the existing data-model.md descriptions of AccumulatedSeconds (printer-level metric, checked during Preparing → InMaintenance transition).
- [ ] CHK009 The A2 resolution is consistent with FR-017's "uma única saída de estoque" and the single-write semantics of material consumption.
- [ ] CHK010 No new unresolved `[NEEDS CLARIFICATION]` tags are introduced by the edits.
- [ ] CHK011 The spec does not change any existing functional requirement, user story, or acceptance scenario from feature 001 — it only resolves placeholders and adds cross-references.

## Testability

- [ ] CHK012 Success Criteria SC-001 provides a verifiable scan command (zero `[NEEDS CLARIFICATION]` matches).
- [ ] CHK013 Success Criteria SC-002 provides a verifiable scan command (26 FR-xxx references in Constitution Check).
- [ ] CHK014 Success Criteria SC-003 provides a verifiable scan command (≥1 FR-003 reference in tasks.md task lines).
- [ ] CHK015 Success Criteria SC-004 provides an exact-string match for the A2 resolution text.

## Quality

- [ ] CHK016 The spec follows the mandatory structure: User Scenarios, Requirements, Success Criteria, Assumptions.
- [ ] CHK017 User stories are written as user journeys (audit team as reviewer) with Given/When/Then acceptance scenarios.
- [ ] CHK018 All Functional Requirements use MUST phrasing (not MAY or SHOULD).
- [ ] CHK019 The spec is technology-agnostic (does not prescribe git commands or editor choices).
