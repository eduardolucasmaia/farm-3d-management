# Implementation Plan: Resolve warnings SDD003 and SDD004

**Branch**: `002-resolve-plan-warnings` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-resolve-plan-warnings/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Resolve two unresolved design findings in the `001-reimplementar-printfarm` feature:
- **SDD003** (A2): Replace `[NEEDS CLARIFICATION]` in `data-model.md` with a definitive answer about whether failed executions accumulate real print time into the printer's `AccumulatedSeconds`.
- **SDD004**: Add FR-003 to the Constitution Check table in `plan.md` and to task cross-references in `tasks.md`, closing a traceability gap between spec and implementation planning.

All resolutions were completed and committed on `002-resolve-plan-warnings` (commit `e00ed06`). This plan documents the design decisions, traces them to the constitution, and records the completed artifacts.

## Technical Context

**Language/Version**: Markdown artifacts (`.md`); feature `001` targets a web application in Python 3.11+ (from `001`'s plan).

**Primary Dependencies**: None new — only existing `001` feature artifacts are edited.

**Storage**: N/A — this feature produces no code; only spec artifact edits.

**Testing**: Automated scan validation via acceptance scenarios in `spec.md` (zero `[NEEDS CLARIFICATION]` tags; 26 FR rows in Constitution Check; FR-003 referenced in tasks).

**Target Platform**: N/A — documentation-only feature.

**Project Type**: Meta-feature (spec artifact audit and correction).

**Performance Goals**: N/A.

**Constraints**: Must not alter feature `001`'s functional requirements or acceptance criteria; only resolve open findings and add cross-references.

**Scale/Scope**: Three files edited (`data-model.md`, `plan.md`, `tasks.md`); two new files created (`002-resolve-plan-warnings/spec.md`, `002-resolve-plan-warnings/checklists/requirements.md`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after design.*

| Princípio | Pergunta | Status | Evidência |
|-----------|----------|--------|-----------|
| I | O núcleo compila sem persistência, HTTP e UI? | N/A | This feature edits only markdown spec artifacts; no code. |
| II | Cada regra tem teste que nasceu antes dela? | N/A | No new rules; no code. |
| III | Algum estado é derivado do outro? | Respeitado | A2 resolution confirms `AccumulatedSeconds` is a printer-level metric independent of lot state (consistent with Principle III). |
| IV | Toda mudança de saldo é movimentação, atômica e não repetível? | Respeitado | No data changes. FR-017's "única saída" rationale confirmed in A2 resolution. |
| V | Há total sem premissa, ou número inventado? | Respeitado | No cost calculations introduced. |
| VI | Algo da lista "Fora" foi criado? | Respeitado | No new code, routes, or dependencies. Only cross-references added. |
| VI | Há estrutura sem requisito? | Respeitado | FR-003 row added to Constitution Check; Complexity Tracking not applicable (no new structure). |
| VII | Toda rota declara papéis e recusa no servidor? | N/A | No routes touched. |
| VII | Há segredo versionado? | Respeitado | No secrets introduced. |

All gates pass. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/002-resolve-plan-warnings/
├── plan.md              # This file
├── spec.md              # Feature specification
├── checklists/requirements.md  # Quality checklist
└── tasks.md             # Not created by /speckit.plan (no tasks for meta-feature)
```

### Artifacts edited in feature 001

```text
specs/001-reimplementar-printfarm/
├── data-model.md        # Line 143: A2 [NEEDS CLARIFICATION] → resolved
├── plan.md              # Constitution Check: FR-003 row added; A2 status → Resolvido
└── tasks.md             # T032–T038: [FR-003] prefix added
```

**Structure Decision**: This is a documentation-only meta-feature. No source code or new directories are created beyond the standard `specs/002-resolve-plan-warnings/` directory. All changes are applied to existing `001` artifacts.

## Complexity Tracking

> No constitution violations — table omitted.

## Clarifications Integration

### Session 2026-11-18 — A2 Resolution

- **Q**: Quando uma impressão falha, como o sistema deve registrar o material já gasto? → **A** (from `001` clarification session): Exigir material gasto ao registrar a falha, aceitando zero, e baixar essa quantidade uma única vez.
- **A2 resolution**: Sim, execução que falha também soma o tempo real de impressão às horas acumuladas. `AccumulatedSeconds` é uma métrica da impressora, independente do estado do lote de produção.

**Rationale**: FR-017 ("uma única saída de estoque") and the printer state machine (Preparing → InMaintenance checks `AccumulatedSeconds ≥ MaintenanceLimitHours × 3600`) confirm that `AccumulatedSeconds` is maintained by the printer's lifecycle events regardless of lot state. A failed execution still consumed time; the state machine must reflect the real wear.

### Session 2026-11-18 — FR-003 Cross-reference

- **Action**: FR-003 added to Constitution Check table in `plan.md` (VI row "Sem estrutura sem requisito").
- **Action**: `[FR-003]` prefix added to tasks T032–T038 in `tasks.md`.
- **Rationale**: FR-003 defines the operational base cadastros implemented by User Story 2. T032–T038 are the exact tasks for these cadastros. The Constitution Check table requires a row for every FR-xxx per Principle VI.

## Completed Changes

| Artifact | Change | Rationale |
|----------|--------|-----------|
| `data-model.md` (line 143) | `[NEEDS CLARIFICATION: execução que falha também soma o tempo real às horas acumuladas?]` → definitive answer "Sim" | SDD003 / A2 resolved |
| `plan.md` analysis findings | A2 status: `Aberto` → `Resolvido` | SDD003 / A2 resolved |
| `plan.md` Constitution Check | New row: FR-003 → VI "Sem estrutura sem requisito" → `[FR-003]` → T032–T038, US2 | SDD004 resolved |
| `tasks.md` T032–T038 | Prefix `[FR-003]` added to each task description | SDD004 resolved — traceability from tasks to FR-003 |
