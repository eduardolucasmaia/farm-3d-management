# Specification Analysis Report

**Data**: 2026-11-17
**Feature**: `001-reimplementar-printfarm`
**Escopo**: análise de [spec.md](spec.md), [plan.md](plan.md) e [tasks.md](tasks.md), com apoio da [constituição](../../.specify/memory/constitution.md), do [modelo de dados](data-model.md) e dos contratos.
**Estado**: achados abertos. A análise original foi somente em leitura; este arquivo registra o relatório, sem aplicar as correções propostas.
**Referência histórica**: este relatório descreve o estado do commit `454feb2`, com a constituição 1.0.0. A integração posterior da constituição 2.0.0 exige nova análise; as localizações numéricas abaixo são as do estado analisado. Os sete achados não foram reavaliados ou encerrados pelo merge.

Foram identificados 7 pontos: 1 CRITICAL, 2 HIGH e 4 MEDIUM. Recomenda-se resolver os três primeiros antes de `$speckit-implement`.

O gate SDD passou, mas não detecta estas inconsistências de comportamento.

## Achados

| ID | Categoria | Severidade | Localização | Resumo | Recomendação |
|---|---|---|---|---|---|
| C1 | Constituição | CRITICAL | [constituição](../../.specify/memory/constitution.md):208; [tasks.md](tasks.md):73 | US1-AS9 foi adiado para a US5. Assim, a US1 não pode ser conferida integralmente antes da história seguinte, como exige a constituição. | Mover o cenário de reimpressão para a US5, preservando na US1 a prova dos parâmetros imutáveis. |
| I1 | Inconsistência | HIGH | [comercial.md](contracts/comercial.md):17; [data-model.md](data-model.md):67 | A conversão recebe apenas a data prometida. O orçamento não guarda cor/tamanho, mas esses campos são obrigatórios no pedido quando oferecidos pelo modelo. | Definir onde as escolhas são informadas, preservá-las na conversão e testar um modelo configurável. |
| U1 | Especificação insuficiente | HIGH | [painel.md](contracts/painel.md):42; [spec.md](spec.md):235 | A previsão retorna horas pendentes e uma nota, sem resultado de término estimado verificável. | Definir a saída da previsão e testar resultados numéricos com calendário, paralelismo e indisponibilidade. |
| G1 | Cobertura parcial | MEDIUM | [spec.md](spec.md):252; [data-model.md](data-model.md):59 | A spec inclui material padrão e arquivo no Modelo; Product e as tarefas que reproduzem sua definição omitem esses vínculos. | Completar modelo, contratos e tarefas com os campos já especificados. |
| I2 | Ordem de execução | MEDIUM | [tasks.md](tasks.md):193; [tasks.md](tasks.md):203 | T089 pede T082 verde, mas T082 inclui cancelamento de lote, implementado somente em T092. | Limitar T089 aos testes de falha ou separar os testes de cancelamento. |
| A1 | Ambiguidade | MEDIUM | [data-model.md](data-model.md):8; [research.md](research.md):70 | A prancha proporcional pode gerar mais de três casas decimais, mas o armazenamento de gramas tem três. Comparar antes de arredondar não define o valor persistido e reservado. | Definir a política de precisão e testar, por exemplo, 1 g dividido entre três peças. |
| A2 | Ambiguidade | MEDIUM | [data-model.md](data-model.md):128 | O acúmulo de horas para manutenção está definido apenas na conclusão. Falhas registram consumo, mas não têm regra explícita para contabilizar tempo. | Definir a contabilização das falhas e testar o limite de manutenção após uma falha. |

## Cobertura

IDs representativos de [tasks.md](tasks.md). "Sim" indica associação a tarefas, não atendimento integral.

| Requisito | Há tarefa? | IDs principais | Nota |
|---|---|---|---|
| FR-001 | Sim | T016, T019, T044 | Autenticação e acesso |
| FR-002 | Sim | T045, T050 | Administração de usuários |
| FR-003 | Sim | T033, T034, T049 | Parcial, G1 |
| FR-004 | Sim | T029, T033 | Perfil e preço |
| FR-005 | Sim | T028, T033 | Impressora e compatibilidade |
| FR-006 | Sim | T053, T061 | Estados do orçamento |
| FR-007 | Sim | T053, T064 | Expiração |
| FR-008 | Sim | T056, T061 | Parcial, I1 |
| FR-009 | Sim | T054, T062, T096 | Cancelamento e concorrência |
| FR-010 | Sim | T057, T063 | Composição das linhas |
| FR-011 | Sim | T026, T029, T035 | C1 e A1 |
| FR-012 | Sim | T027, T030, T038 | Reserva integral |
| FR-013 | Sim | T028, T031, T087 | Atribuição e início |
| FR-014 | Sim | T078, T085, T088 | Estados independentes |
| FR-015 | Sim | T079, T090 | Retirada e preparação |
| FR-016 | Sim | T078, T090 | A2 |
| FR-017 | Sim | T080, T082, T088 | Consumo real |
| FR-018 | Sim | T081, T082, T089 | I2 |
| FR-019 | Sim | T069, T073 | Recebimento |
| FR-020 | Sim | T068, T075 | Recompra |
| FR-021 | Sim | T095, T099 | Financeiro |
| FR-022 | Sim | T104, T105, T110 | Painel |
| FR-023 | Sim | T103, T104, T110 | Parcial, U1 |
| FR-024 | Sim | T023, T113, T115 | Auditoria |
| FR-025 | Sim | T009, T112 | Dados fictícios |
| FR-026 | Sim | T097, T117 | Limites de escopo |
| SC-002 | Sim | T027, T030 | Sem reserva parcial |
| SC-003 | Sim | T028, T031 | Compatibilidade |
| SC-004 | Sim | T078, T090 | Disponibilidade |
| SC-005 | Sim | T056, T061 | Conversão única |
| SC-006 | Sim | T027, T069, T073 | Saldo e FIFO |
| SC-007 | Sim | T104, T106, T110 | Atrasos e premissas |

SC-001, SC-008 e SC-009 são resultados de jornada ou observação piloto, tratados no quickstart e fora do inventário de trabalho construível acima.

## Constituição e tarefas sem associação

C1 é um conflito direto com a exigência constitucional de conferir cada história independentemente antes da seguinte. A correção deve ocorrer nos artefatos, preservando a constituição.

Não foram identificadas tarefas sem propósito associado após considerar infraestrutura, histórias e evidências de entrega.

## Métricas

- 32 requisitos analisados: 26 FR e 6 SC construíveis.
- 119 tarefas, todas pendentes.
- 100% com tarefa associada, com as lacunas parciais indicadas.
- 2 ambiguidades, nenhuma duplicação relevante e 1 questão crítica.
- Gate estrito: zero erros e avisos.
- Nenhum arquivo foi alterado durante a análise original.

## Próximas ações

Resolver C1, I1 e U1 antes da implementação. Depois, propagar os ajustes com `$speckit-plan` e `$speckit-tasks` e repetir `$speckit-analyze`.

A proposta de edições concretas e sua aplicação dependem de uma solicitação posterior. Salvar este relatório e registrar os artefatos em commits não resolve nem encerra os achados.
