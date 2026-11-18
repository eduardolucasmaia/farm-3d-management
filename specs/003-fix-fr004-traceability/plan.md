# Implementation Plan: Fix FR-004 traceability gap

**Branch**: `003-fix-fr004-traceability` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-fix-fr004-traceability/spec.md`

## Summary

Fix the traceability gap for **FR-004** in feature `001-reimplementar-printfarm`. FR-004 ("Um modelo MUST guardar preço de venda distinto de custo. Um perfil de produção MUST guardar peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero, para que a liberação seja possível.") is defined in `spec.md` (line 217) but is missing from:

1. The Constitution Check table in `plan.md` — no row referencing FR-004.
2. `tasks.md` — no task explicitly tagged `[FR-004]` (T032's scope covers the validation but lacks the tag).

This feature adds the missing row and tag without altering any other content.

## Technical Context

**Language/Version**: Node.js + TypeScript + SQLite (same stack as feature 001, inherited)

**Primary Dependencies**: None — no new code or packages.

**Storage**: N/A — only markdown artifacts are edited.

**Testing**: The "test" is the audit script (`/speckit-checklist` and manual scan) verifying that every FR-001…FR-026 appears in the Constitution Check table and that FR-004 appears in at least one task line.

**Target Platform**: N/A — documentation-only change.

**Project Type**: Meta-feature (documentation traceability fix). No source code changes.

**Performance Goals**: N/A.

**Constraints**: Only `plan.md` and `tasks.md` inside `specs/001-reimplementar-printfarm/` may be modified. No other file in feature 001's directory may change (FR-005).

**Scale/Scope**: Two markdown files, a single row in a table, and one tag insertion.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Gate | Antes da edição | Depois da edição (evidência) |
|-----------|------|-----------------|------------------------------|
| I. Domínio puro, casca fina | Sem código novo no domínio | Nenhum código escrito | N/A — apenas markdown editado |
| II. Teste antes da regra | N/A (sem regra nova) | — | O audit verifica a traceabilidade antes do merge |
| III. Dois estados | N/A | — | — |
| IV. Rastreio sem baixa duplicada | FR-004 adicionado à trilha | FR-004 ausente no plan e tasks | FR-004 terá linha em plan.md e `[FR-004]` em tasks.md |
| V. Estimativa explícita, dado fictício marcado | N/A | — | — |
| VI. Escopo parado | FR-005: nada fora do escopo | — | Apenas plan.md e tasks.md são editados; nenhum outro arquivo tocado |
| VII. Acesso por papel, segredo fora do repositório | N/A | — | — |

Nenhuma violação. A única mudança é adicionar a linha FR-004 ao Constitution Check de plan.md e o tag `[FR-004]` a uma tarefa em tasks.md.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-fr004-traceability/
├── plan.md              # This file (/speckit.plan command output)
└── spec.md              # Feature specification
```

### Files modified (feature 001 directory)

```text
specs/001-reimplementar-printfarm/
├── plan.md              # ADD: FR-004 row in Constitution Check table
└── tasks.md             # ADD: [FR-004] tag to T032 (or nearest matching task)
```

**Structure Decision**: This is a documentation-only meta-feature. No new source code, no data model changes, no contracts, no quickstart validation needed. The only changes are targeted edits to two existing markdown files.

## Complexity Tracking

> This feature has zero complexity. No justification table needed.

## Phase 0: Research

No NEEDS CLARIFICATION entries remain in the spec. FR-004's location in `spec.md` is known (line 217), its implementation is covered by T032's scope in `tasks.md`, and the Constitution Check table format is inherited from the existing 26-row structure in `plan.md`. No research is required.

**Output**: N/A — `research.md` is not generated for this documentation-only meta-feature.

## Phase 1: Design & Contracts

**data-model.md**: N/A — no entities, fields, or relationships are introduced.

**contracts/**: N/A — no external interfaces, routes, or schemas are modified.

**quickstart.md**: N/A — no functional behavior to validate. The validation is the audit scan (see Success Criteria in spec.md).

## Execution Plan

### Step 1 — Add FR-004 to Constitution Check table in `plan.md`

Insert a row between the existing FR-003 row and the first row after it, matching the table's format. The FR-004 rule covers two concepts:

- **Model selling price distinct from cost** — maps to Constitution principle V ("Custo estimado MUST permanecer distinto do preço de venda")
- **Production profile with positive pieces/minutes/grams per plate** — maps to the release logic, which depends on profile data being non-zero (related to principle V "premissa ausente deve impedir o total")

**Evidence column**: T032 covers the validation logic for both concepts.

### Step 2 — Add `[FR-004]` tag to tasks in `tasks.md`

Add `[FR-004]` to T032's description (or to the task line that implements the FR-004 validation rules). T032 is the task that handles `master-data-rules.ts` and validates that model cost ≠ selling price and profile values > 0.

### Step 3 — Validate with audit scan

Run the checklist to confirm all 26 FR-xxx entries are in the Constitution Check table and FR-004 appears in at least one task line.

### Step 4 — Commit and merge

Commit the two file changes. Merge `003-fix-fr004-traceability` into the default branch.
