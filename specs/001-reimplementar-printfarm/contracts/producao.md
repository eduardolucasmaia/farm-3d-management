# Contract: Produção

Sessão obrigatória. Convenções de erro, números e datas: contracts/auth.md. Gramas com até 3 casas; minutos com até 2. Revisão de 2026-11-17 baseada nas cinco respostas em `spec.md#clarifications`.

| Ação | Papéis |
|------|--------|
| Liberar, enfileirar, cancelar lote | Production, Admin |
| Iniciar, pausar, retomar, concluir, falhar, retirada, preparação | Operator, Production, Admin |
| Confirmar manutenção, marcar indisponível | Production, Admin |
| Consultar fila e impedimentos | Operator, Production, Admin |

Erros de negócio usam Problem Details com `code` estável e campos específicos de contexto. Sem sessão: 401; papel sem permissão: 403; campos inválidos: 400; estado ilegal ou saldo insuficiente: 409. Falha de infraestrutura (por exemplo, banco ocupado além do `busy_timeout`): 503, sem exposição de SQL ou segredos. O cliente consulta o estado antes de repetir. A infraestrutura traduz exceções específicas, preservando a causa nos registros técnicos.

## POST /api/sales-orders/{id}/lots/release

Só pedido Approved ou InProduction por planejamento já existente. Corta cada linha ainda sem lotes, preservando o comportamento integral por linha já definido no plano.

- 201: lotes com qtyPlanned, plannedGrams, plannedMinutes, releasedPiecesPerPlate, releasedMinutesPerPlate, releasedGramsPerPlate e status Queued. A liberação passa por Released e cria a fila inicial sem impressora na mesma operação; as duas mudanças de estado ficam na trilha.
- 409: saldo insuficiente, com `code: INSUFFICIENT_MATERIAL`, lotIndex, neededGrams e freeGrams; não grava novos lotes, fila ou reservas para a linha recusada.
- 409: peças por prancha ausentes ou pedido QuotePending ou Cancelled.
- Repetir linha já liberada: 409, reserva e lotes não dobram.

O cenário de prova: 10 peças, 4 por prancha geram três lotes, o último com metade das gramas e minutos da prancha cheia. Os campos released* são preservados após editar o perfil, inclusive em reimpressões. Somente novas liberações usam o perfil atualizado. FR-011 e FR-012.

## GET /api/lots?status=

Papéis: Production, Operator, Admin. `status` aceita uma lista separada por vírgula de valores de `ProductionLotStatus`; sem `status`, devolve Released e Queued. Ordem: posição na fila, depois pedido e índice do lote.

Itens: `id`, `orderNumber`, `productName`, `materialName`, `lotIndex`, `qtyPlanned`, `plannedGrams`, `plannedMinutes`, `reservedGrams`, `missingMaterialG`, `releasedPiecesPerPlate`, `releasedMinutesPerPlate`, `releasedGramsPerPlate`, `status`, `printerId`, `printerName`, `priority`, `position`.

`missingMaterialG = max(0, plannedGrams - reservedGrams)`. É um impedimento calculado, não um novo estado. Reimpressão sem complemento integral continua Queued com esse valor positivo. Disponibilidade da impressora é conferida separadamente. FR-018.

## POST /api/lots/{id}/queue

Corpo: `{ "printerId": number|null, "priority": number }`. Só lote Released ou Queued; outro estado: 409.

- 201 para um lote Released ainda sem fila; 200 para atribuir ou trocar a impressora do item Queued já existente. Nunca duplicar o item ativo do lote de produção.
- Mais de um lote pode esperar na fila da mesma impressora. "Ocupada" é a impressora fora de Available (Printing, AwaitingPickup, Preparing); "Dois lotes não ocupam a mesma impressora ao mesmo tempo" é garantido ao iniciar a execução.
- 409: impressora inativa, indisponível, ocupada, em manutenção ou incompatível. Lista vazia de materiais aceita qualquer material.

A fila inicial criada na liberação não dispensa essas validações ao atribuir uma impressora. FR-013.

## POST /api/lots/{id}/runs

Corpo: `{ "printerId": number, "operatorId": number|null }`. A impressora deve respeitar a atribuição da fila, se houver; nenhuma troca implícita é feita.

- Dentro da transação, validar pedido não cancelado, lote Queued e máquina Available, ativa e compatível.
- Para reimpressão com reserva incompleta, tentar automaticamente o complemento integral FIFO. Sem saldo, 409 com `code: INSUFFICIENT_MATERIAL`, neededGrams, freeGrams e missingMaterialG; preservar a reserva restante e a PrintRun Planned.
- Com reserva completa, iniciar a PrintRun Planned existente ou criar a execução inicial. Lote vai a Printing, impressora a Printing e OccupyingPrintRunId passa a apontar para essa execução. Remover o item da fila ativa ao iniciar.
- 201 para execução inicial nova; 200 ao ativar a reimpressão Planned já registrada. Retornar runId e estado Running.
- Segundo início: 409, sem execução ou reserva duplicada.

O pedido e os registros financeiros compartilham a disciplina transacional do cancelamento em `comercial.md`. FR-009, FR-013 e FR-018.

## POST /api/runs/{id}/pause e /resume

Só Running para Paused e Paused para Running. PausedSeconds acumula. Pausa não libera a máquina.

## POST /api/runs/{id}/complete

Corpo: `{ "actualMaterialG": decimal, "actualMinutes": decimal }`.

- actualMaterialG obrigatório e maior que zero; actualMinutes obrigatório e não negativo. Inválidos: 400 sem efeitos.
- Consumir primeiro a reserva própria. Excesso usa somente saldo livre do mesmo material, por ReceivedAt e Id, sem usar reservas alheias.
- Se o consumo não couber, 409 `INSUFFICIENT_MATERIAL` com reservedGrams, freeGrams, actualMaterialG e missingMaterialG. Não alterar execução, lote de produção, impressora, reservas ou estoque.
- Sucesso: 200, execução Completed, lote AwaitingPickup, impressora AwaitingPickup ainda vinculada à execução ocupante. Liberar eventual sobra da reserva. Uma única baixa lógica ProductionOut por execução, detalhada em movimentos por lote de material e custo; soma das saídas = actualMaterialG.
- Segunda conclusão ou conclusão de execução já falha: 409, sem novos movimentos.

Estado, baixa, liberação da sobra e trilha são confirmados juntos. FR-017 e FR-024.

## POST /api/printers/{id}/pickup

De AwaitingPickup para Preparing. 409 nos demais estados. Consultar OccupyingPrintRunId antes de limpá-lo.

Se a execução ocupante está Completed, o lote vai a Completed. Se está Failed, a retirada não muda o estado atual do lote de produção nem o de uma reimpressão. Sem reimpressão, permanece Failed; com reimpressão, preservar Queued ou o estado que ela já alcançou em outra máquina. A retirada nunca torna a impressora Available. FR-015.

## POST /api/printers/{id}/preparation-complete

Se horas acumuladas abaixo do limite: Available. Se iguais ou acima: InMaintenance. Não devolver Available com outro bloqueio.

## POST /api/printers/{id}/maintenance-complete

Corpo: `{ "note": string }`, não vazio. Zera horas acumuladas. Vai a Available se não houver bloqueio de indisponibilidade.

## POST /api/runs/{id}/fail

Corpo: `{ "reason": "None"|"BedAdhesion"|"Clog"|"LayerShift"|"OutOfMaterial"|"Other", "notes": string|null, "actualMaterialG": decimal, "scheduleReprint": bool }`.

Só Running ou Paused. Já terminal: 409 sem nova baixa ou reimpressão. actualMaterialG é obrigatório e maior ou igual a zero; omissão ou negativo: 400 sem efeitos. Zero registra a falha sem saída de estoque.

Consumo positivo segue a mesma alocação e recusa integral de `/complete`, com movimentos Waste em vez de ProductionOut. Falta para o consumo real: 409 sem alterar a operação. Após consumo válido:

- scheduleReprint false: execução Failed, lote Failed, Unreserve do restante, impressora AwaitingPickup vinculada à execução que falhou.
- scheduleReprint true: execução Failed, lote Queued, reserva restante preservada, uma nova PrintRun Planned com ReprintOfPrintRunId e item de fila sem atribuição automática de impressora. Tentar complementar a reserva até as plannedGrams originais, integralmente e por FIFO.
- Se faltar apenas o complemento, confirmar a falha e seu consumo, sem complemento parcial. Responder 200 com failedRunId, reprintRunId, reservedGrams e missingMaterialG. missingMaterialG positivo bloqueia o início; não é erro que desfaça a falha.
- Se o complemento couber, confirmar reserva completa, missingMaterialG zero e execução Planned. Isso não inicia a máquina nem dispensa retirada e preparação da anterior.

Qualquer falha de infraestrutura desfaz a transação inteira. FR-018 distingue essa falha técnica do resultado de negócio de complemento insuficiente.

## POST /api/lots/{id}/cancel

Só AwaitingPlanning, Released ou Queued. Liberar reservas e remover fila e planejamento sem início. 409 se Printing ou estado posterior. O cancelamento de um pedido segue as condições adicionais de `comercial.md` e não é implementado como várias chamadas isoladas deste endpoint.
