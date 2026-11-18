---
description: "Task list for fixing the FR-004 traceability gap in feature 001"
---

# Tasks: Fix FR-004 traceability gap

**Input**: Design documents from `/specs/003-fix-fr004-traceability/`

**Prerequisites**: plan.md, spec.md

**Tests**: No code is written — no automated tests. The "test" is the audit scan confirming traceability.

**Organization**: Single user story (P1) — one audit team verifies FR-004 is traceable through all artifacts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Load context from existing artifacts

- [X] T001 Read `specs/001-reimplementar-printfarm/plan.md` Constitution Check table to locate the FR-003 row and identify insertion point for FR-004

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm current traceability gaps

- [X] T002 Verify `specs/001-reimplementar-printfarm/plan.md` Constitution Check table has no row referencing FR-004 (scan for "FR-004" in the table body)
- [X] T003 Verify `specs/001-reimplementar-printfarm/tasks.md` has no task line containing `[FR-004]` (grep for "FR-004" in task lines)
- [X] T004 Read FR-004 definition from `specs/001-reimplementar-printfarm/spec.md` line 217 and confirm T032 in `tasks.md` already covers the FR-004 validation logic

---

## Phase 3: User Story 1 - Audit team verifies FR-004 traceability (Priority: P1) 🎯 MVP

**Goal**: Close the traceability gap for FR-004 by adding it to the Constitution Check table in `plan.md` and tagging the relevant task in `tasks.md`.

**Independent Test**: Run the spec-quality checks on `specs/001-reimplementar-printfarm/`. Verify that FR-004 has a row in the Constitution Check table of `plan.md` and is explicitly referenced by at least one task ID in `tasks.md`.

### Implementation for User Story 1

- [X] T005 [P] [US1] Insert FR-004 row in Constitution Check table of `specs/001-reimplementar-printfarm/plan.md`, between the existing FR-003 row (line 54) and the "Sem estrutura sem requisito" row (line 55), with Principle V ("Custo estimado MUST permanecer distinto do preço de venda"), gate "FR-004: modelo preço ≠ custo; perfil valores > 0", pre-edit "FR-004 ausente", post-edit "T032 (`master-data-rules.test.ts`) valida preço de venda ≠ custo e peças/minutos/gramas por prancha > 0; FR-004 adicionado nesta edição"
- [X] T006 [P] [US1] Add `[FR-004]` tag to T032 description line in `specs/001-reimplementar-printfarm/tasks.md` (line 127), changing `[FR-003]` to `[FR-003] [FR-004]` so the line reads: `- [ ] T032 [P] [US2] [FR-003] [FR-004] Escrever...`
- [X] T007 [US1] Validate Constitution Check table: scan `specs/001-reimplementar-printfarm/plan.md` for "FR-001" through "FR-026" — confirm FR-004 now appears and all 26 FR entries are present
- [X] T008 [US1] Validate task traceability: scan `specs/001-reimplementar-printfarm/tasks.md` for "FR-004" — confirm at least one task line contains `[FR-004]`

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Finalize the feature

- [X] T009 Run `git diff --name-only` on `specs/001-reimplementar-printfarm/` — confirm only `plan.md` and `tasks.md` are modified (FR-005 constraint)
- [X] T010 Commit changes with message: `docs(003): add FR-004 to Constitution Check and task traceability`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — read context
- **Foundational (Phase 2)**: Depends on Setup — confirm gaps exist before editing
- **User Story 1 (Phase 3)**: Depends on Foundational — edit `plan.md` and `tasks.md`
- **Polish (Final Phase)**: Depends on User Story 1 — validate and commit

### User Story Dependencies

- **User Story 1 (P1)**: Only story — no cross-story dependencies

### Within User Story 1

- T005 and T006 can run in parallel (different files: `plan.md` vs `tasks.md`)
- T007 and T008 must run after T005 and T006 (validation of edits)

### Parallel Opportunities

- T005 [P] and T006 [P] — editing `plan.md` and `tasks.md` simultaneously

---

## Parallel Example: User Story 1

```bash
# Launch FR-004 row insertion (plan.md) and tag addition (tasks.md) in parallel:
Task: "Insert FR-004 row in Constitution Check table of specs/001-reimplementar-printfarm/plan.md"
Task: "Add [FR-004] tag to T032 in specs/001-reimplementar-printfarm/tasks.md"

# After both complete, validate:
Task: "Validate Constitution Check table scan"
Task: "Validate task traceability scan"
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup — read existing artifacts
2. Complete Phase 2: Foundational — confirm FR-004 is missing
3. Complete Phase 3: User Story 1 — add FR-004 row + tag, validate
4. Complete Phase N: Polish — diff check and commit
5. **STOP and VALIDATE**: Run audit scan (SC-001, SC-002, SC-003)

### Parallel Team Strategy

With multiple developers:
1. T005 and T006 can be done by different people (different files)
2. T007 and T008 run after both edits are complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to US1 for traceability
- No code is written — only two markdown files are edited
- FR-005: No file outside `plan.md` and `tasks.md` in `specs/001-reimplementar-printfarm/` may be changed
- Commit after Phase 3 (all edits done) or after Phase N (with diff verification)
