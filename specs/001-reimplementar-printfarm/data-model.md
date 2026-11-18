# Data Model: Reimplementar o núcleo da farm

**Feature**: `specs/001-reimplementar-printfarm`
**Date**: 2026-11-16 | **Revisado**: 2026-11-17 (unidades inteiras para a stack Node.js + SQLite; regras das clarificações de 2026-11-17 integradas)

Nomes de código em inglês, rótulos de tela em português, conforme o vocabulário da constituição. "Lote" sozinho não aparece em rótulo.

## Unidades e representação

Todo valor numérico do domínio e do banco é inteiro, numa escala fixa. O sufixo do nome diz a unidade. Nenhum campo fracionário existe no domínio (research.md item 11).

| Sufixo | Unidade | Casas aceitas na API | Exemplo |
|--------|---------|----------------------|---------|
| `Cents` | centavo | 2 (reais) | R$ 12,50 → `1250` |
| `CentsPerKg` | centavo por kg | 2 (reais por kg) | R$ 89,90/kg → `8990` |
| `CentsPerHour` | centavo por hora | 2 (reais por hora) | R$ 4,00/h → `400` |
| `CentsPerMwh` | centavo por MWh | 5 (reais por kWh) | R$ 0,65632/kWh → `65632` |
| `Mg` | miligrama | 3 (gramas) ou 6 (quilos) | 40 g → `40000`; 1 kg → `1000000` |
| `WhPerHour` | Wh por hora | 3 (kWh por hora) | 0,12 kWh/h → `120` |
| `Seconds` | segundo | 2 (minutos) | 60 min → `3600` |
| `Um` | micrômetro | 3 (mm) | 1,75 mm → `1750` |

- A API recebe e devolve as unidades humanas dos contratos (reais, gramas, quilos, minutos, R$/kWh, kWh por hora). A conversão acontece só na rota, com `parseScaled` e `formatScaled` de `server/src/domain/units.ts`. Valor com mais casas que a tabela: 400.
- Multiplicação seguida de divisão usa `mulDivRoundHalfUp` (dinheiro, metade para cima) ou `mulDivCeil` (peso e tempo de prancha parcial, para cima).
- Quantidade de peças e horas de limite de manutenção são inteiros sem escala.
- Instante: texto ISO-8601 em UTC com milissegundos (`2026-11-17T13:05:00.000Z`). Data sem hora: `AAAA-MM-DD`. Hora local: `HH:mm`.
- Identificador: `INTEGER` autoincremento, exceto `User.Id`, que é UUID em texto.
- Enum: texto com o valor exato da tabela abaixo; a coluna tem `CHECK` com a lista de valores.
- Booleano: `INTEGER` 0 ou 1.

## Enums

| Nome | Valores |
|------|---------|
| AppRole | Admin, Sales, Production, Purchasing, Operator |
| MaterialKind | Filament, Resin, SparePart, Packaging, Other |
| QuoteStatus | Draft, Sent, Approved, Rejected, Expired, OrderGenerated |
| CommercialOrderStatus | QuotePending, Approved, InProduction, AwaitingFinishing, ReadyToShip, Delivered, Cancelled |
| ProductionLotStatus | AwaitingPlanning, Released, Queued, Printing, Paused, AwaitingPickup, Completed, Failed, Cancelled |
| PrinterOperationalStatus | Available, Printing, AwaitingPickup, Preparing, InMaintenance, Unavailable |
| PrintRunStatus | Planned, Running, Paused, Failed, Completed |
| PrintFailureReason | None, BedAdhesion, Clog, LayerShift, OutOfMaterial, Other |
| PurchaseOrderStatus | Draft, Sent, PartiallyReceived, Received, Cancelled |
| StockMovementKind | PurchaseIn, ProductionOut, Adjustment, Reserve, Unreserve, Waste |
| PaymentMethod | Cash, Card, Pix, BankTransfer, Other |

Rótulos de `ProductionLotStatus`: Aguardando planejamento, Liberado, Na fila, Em impressão, Pausado, Aguardando retirada, Concluído, Falha, Cancelado.

Rótulos de `PrinterOperationalStatus`: Disponível, Em impressão, Aguardando retirada, Em preparação, Em manutenção, Indisponível.

## User

- **User**: Id (UUID); Email obrigatório, único, guardado em minúsculas; Name obrigatório; PasswordHash no formato `scrypt$<saltBase64>$<hashBase64>`; Role (AppRole); FailedLoginCount ≥ 0; LockedUntil instante opcional; CreatedAt.
- Política de senha e travamento: research.md item 4. "Senha guardada de forma irreversível."

## FarmSettings

Uma linha só.

| Campo | Regra |
|-------|--------|
| EnergyTariffCentsPerMwh | inteiro opcional ≥ 0. Nulo significa premissa ausente. |
| CalendarSummary | texto obrigatório. Padrão: "segunda a sexta, 08:00–18:00". |
| WorkDays | lista de dias da semana (1 = segunda … 7 = domingo). Padrão: 1 a 5. |
| WorkStart / WorkEnd | hora local `HH:mm`. Padrão: 08:00 e 18:00. |
| TimeZone | fuso IANA. Padrão: `America/Sao_Paulo`. |
| ExamplesAreFictional | bool. MUST permanecer verdadeiro enquanto os números de exemplo não forem série medida. Coluna com `CHECK` que só aceita 1. |

## Customer, Supplier, Color

- **Customer**: Name obrigatório; Email, Phone, Address opcionais; CreatedAt.
- **Supplier**: Name obrigatório; PaymentTerms e AverageLeadTimeDays opcionais; contato opcional.
- **Color**: Name obrigatório; Hex opcional no formato `#RRGGBB`.

## Material e estoque

- **Material**: Name obrigatório; Kind obrigatório; ReferenceCostCentsPerKg ≥ 0; ReorderPointMg nulo ou ≥ 0; DiameterUm nulo ou > 0; ColorId opcional.
- **MaterialLot**: MaterialId e SupplierId obrigatórios; LotCode obrigatório e único por material; ReceivedAt obrigatório; InitialWeightMg > 0; CurrentWeightMg ≥ 0 e ≤ InitialWeightMg; CostCentsPerKg ≥ 0.
- **StockItem**: MaterialId obrigatório; MaterialLotId opcional (nulo = agregado do material, não usado na reserva); QuantityMg ≥ 0; ReservedMg ≥ 0; ReservedMg ≤ QuantityMg. Livre = QuantityMg − ReservedMg.
- **StockMovement**: Kind obrigatório; QuantityMg > 0; UnitCostCentsPerKg ≥ 0; CreatedAt; UserId; StockItemId e MaterialLotId identificam o saldo e o custo afetados; origem em ProductionLotId, PrintRunId ou PurchaseReceiptId conforme a ação. Consumo terminal exige PrintRunId e ProductionLotId. Consumo de vários lotes de material gera um detalhe por origem; parcelas de reserva própria e de saldo livre do mesmo StockItem são somadas no mesmo detalhe. Os detalhes de um PrintRunId formam uma única baixa lógica, cuja soma é ActualMaterialMg. ProductionOut identifica conclusão e Waste identifica falha; zero na falha não gera saída. Índice único em PrintRunId + StockItemId para movimentos ProductionOut ou Waste impede duas linhas terminais da mesma origem na mesma execução. "Movimentação guarda tipo, gramas, custo unitário e origem."

## Catálogo de produção

- **File3D**: Name obrigatório. **File3DVersion**: VersionLabel obrigatório; StoragePath obrigatório e relativo a `FARM3D_FILES_DIR`; CreatedAt.
- **PrintProfile**: Name obrigatório; PiecesPerPlate ≥ 1 inteiro; SecondsPerPlate > 0; MgPerPlate > 0; MaterialId opcional. "Peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero."
- **Product** (modelo): Name e Sku obrigatórios, Sku único; DefaultSellPriceCents ≥ 0; DefaultPrintProfileId obrigatório para liberar; IsForSale bool; listas de ColorId e tamanhos (texto curto) oferecidos. Preço de venda não é custo.
- **Printer**: OccupyingPrintRunId opcional identifica a execução na mesa desde o início até a retirada, inclusive depois de falhar ou concluir; criar reimpressão não troca esse vínculo. Name obrigatório; CostCentsPerHour ≥ 0; EnergyWhPerHour nulo ou ≥ 0; MaintenanceLimitHours > 0 inteiro; AccumulatedSeconds ≥ 0; PreparationSeconds ≥ 0; IsActive; OperationalStatus; HourRateExcludesFilamentAndEnergy MUST ser verdadeiro e não editável. "Limite de horas de manutenção maior que zero." "A taxa de hora-máquina não inclui filamento nem energia."
- **PrinterMaterial**: par PrinterId + MaterialId. Lista vazia significa compatível com qualquer material.
- **Operator**: Name obrigatório; UserId opcional.

## Comercial

- **Quote**: Number único; CustomerId; Status; ValidUntil data opcional; Notes; CreatedAt; TotalCents = soma das linhas. Transições: Draft → Sent; Draft ou Sent → Approved; Draft, Sent ou Approved → Rejected; Draft, Sent ou Approved → Expired só pelo processamento periódico quando ValidUntil já passou no dia local da farm; Approved → OrderGenerated só na geração do pedido. Rejected, Expired e OrderGenerated não geram pedido. "Rejeitado e pedido gerado não são expirados."
- **QuoteLine**: ProductId; Quantity > 0 inteiro; UnitPriceCents ≥ 0; MaterialId opcional. SubtotalCents = Quantity × UnitPriceCents, exato.
- **SalesOrder**: Number único; CustomerId; QuoteId opcional; CommercialStatus; PromisedDate data opcional no pedido manual e obrigatória na geração por orçamento; FreightCents ≥ 0; PackagingCents ≥ 0; Notes. Pedido manual nasce QuotePending. De QuotePending só para Approved ou Cancelled. Cancelled não muda. Cancelamento também é permitido em Approved ou InProduction se só houve planejamento: sem qualquer PrintRun com StartedAt (inclusive já encerrada), Invoice ou Payment. Cancela os ProductionLot pendentes, remove fila e PrintRun Planned sem início, libera reservas com Unreserve e grava trilha numa só transação; qualquer impedimento recusa sem alterar dados. Demais transições: contracts/comercial.md. "Pedido em confirmação pendente não gera lote de produção, fatura nem pagamento."
- **OrderLine**: ProductId; Quantity > 0; UnitPriceCents ≥ 0; MaterialId obrigatório na liberação; ColorId obrigatório se o modelo oferece cores; Size obrigatório se o modelo oferece tamanhos. A escolha fica gravada.

## Produção

- **ProductionLot**: SalesOrderId; OrderLineId; ProductId; MaterialId; LotIndex ≥ 1, único no pedido; QtyPlanned > 0; QtyCompleted ≥ 0 e ≤ QtyPlanned; Status; PlannedMg > 0; PlannedSeconds > 0; ReleasedPiecesPerPlate ≥ 1; ReleasedSecondsPerPlate > 0; ReleasedMgPerPlate > 0; CreatedAt; ReleasedAt opcional; CompletedAt opcional.
- **Parâmetros preservados**: ReleasedPiecesPerPlate, ReleasedSecondsPerPlate e ReleasedMgPerPlate são copiados do perfil na liberação e não mudam depois dela. PlannedMg e PlannedSeconds são calculados a partir deles uma vez. Editar PrintProfile só afeta liberações futuras. Reimpressões usam o mesmo ProductionLot e não releem o perfil.
- **Corte**: quantidade de lotes = teto(peças da linha / peças por prancha). Lote cheio: PlannedMg = MgPerPlate e PlannedSeconds = SecondsPerPlate. Lote incompleto: ambos × (peças do lote / peças por prancha), arredondados para cima ao inteiro. "10 peças com 4 por prancha produzem 3 lotes, o último com metade do tempo e metade do material."
- **ProductionMaterialReservation**: ProductionLotId; StockItemId; ReservedMg > 0 nas reservas ativas; par ProductionLotId + StockItemId único. Consumo reduz ou encerra a reserva, sem apagar suas movimentações. Uma liberação bem-sucedida cobre PlannedMg. Após falha, a reserva restante pode ser menor enquanto aguarda complemento; isso não autoriza iniciar. Complemento integral = max(0, PlannedMg − soma das reservas restantes). "Saldo insuficiente recusa a liberação inteira, sem reserva parcial." "Repetir a liberação já reservada é recusado."
- **PrintQueueItem**: ProductionLotId único na fila ativa; PrinterId opcional; Priority inteiro; Position inteiro ≥ 1. A liberação cria o item sem impressora; a atribuição posterior valida compatibilidade e ocupação e atualiza o mesmo item. A consulta inclui ReservedMg e MissingMg = max(0, PlannedMg − ReservedMg); MissingMg positivo bloqueia o início até completar a reserva.
- **PrintRun**: ProductionLotId; PrinterId opcional em Planned e obrigatório desde Running; OperatorId opcional; Status; StartedAt opcional até Running; EndedAt; PausedSeconds ≥ 0; FailureReason; FailureNotes; ActualMaterialMg nulo antes do encerramento, > 0 em Completed e ≥ 0 em Failed; ActualSeconds; ReprintOfPrintRunId opcional e único quando preenchido. O consumo se rastreia pelos StockMovement ligados à execução. Só uma execução Planned, Running ou Paused por lote de produção. Iniciar uma reimpressão ativa a Planned existente; a Failed anterior continua terminal.

### Transições do lote de produção

| De | Evento | Para |
|----|--------|------|
| AwaitingPlanning | liberar com reserva integral | Released |
| Released | enfileirar (a liberação já enfileira sem impressora, na mesma transação) | Queued |
| Queued | iniciar execução com reserva completa e impressora disponível | Printing |
| Printing | pausar | Paused |
| Paused | retomar | Printing |
| Printing | concluir impressão | AwaitingPickup |
| AwaitingPickup | confirmar retirada após execução concluída | Completed |
| Printing ou Paused | falhar sem reimpressão | Failed |
| Printing ou Paused | falhar com reimpressão | Queued |
| AwaitingPlanning ou Released ou Queued | cancelar lote ou cancelar pedido elegível | Cancelled |

Completed, Failed e Cancelled não mudam, salvo o retorno Queued no caso de reimpressão a partir de Printing ou Paused (o lote que falhou com reimpressão não permanece em Failed).

Um pedido está produzido somente quando todos os seus lotes estão Completed.

### Transições da impressora

| De | Evento | Para |
|----|--------|------|
| Available | iniciar execução | Printing |
| Printing | concluir impressão ou falhar execução | AwaitingPickup |
| AwaitingPickup | confirmar retirada e limpar OccupyingPrintRunId | Preparing |
| Preparing | concluir preparação e horas acumuladas < limite e não bloqueada | Available |
| Preparing | concluir preparação e horas acumuladas ≥ limite | InMaintenance |
| InMaintenance | confirmar manutenção com nota | Available, se não estiver marcada indisponível |
| qualquer exceto InMaintenance | admin marca indisponível | Unavailable |
| Unavailable | admin reativa, sem manutenção vencida e sem execução aberta | Available |

Pausa do lote não muda o estado da impressora: ela permanece Em impressão. A retirada consulta OccupyingPrintRunId antes de limpá-lo. Se a execução ocupante concluiu, marca o lote como Concluído. Se falhou, não altera o estado atual do lote nem o de uma reimpressão, inclusive se ela já começou em outra impressora. Sem reimpressão, o lote permanece em Falha.

"Concluir a impressão deixa o lote aguardando retirada e a impressora aguardando retirada." "A impressora só volta a disponível depois da retirada e da preparação, e somente se as horas acumuladas estiverem abaixo do limite."

Horas acumuladas aumentam pelo tempo real de impressão na conclusão e também na falha (mesma regra: AccumulatedSeconds é uma métrica da impressora, independente do estado do lote de produção). Não aumenta pela pausa.

### Consumo e reimpressão

1. Validar execução Running ou Paused e material real obrigatório. Omissão ou negativo recusa sem efeitos; a conclusão também recusa zero.
2. Planejar o consumo das reservas do próprio ProductionLot por ReceivedAt e Id do lote de material. Só o excesso usa QuantityMg − ReservedMg de lotes do mesmo material, na mesma ordem. Se faltar para o consumo, recusar a operação inteira, inclusive os dois estados e a trilha.
3. Consumo da reserva reduz QuantityMg, CurrentWeightMg, ReservedMg e a reserva própria na mesma quantidade. Consumo do saldo livre reduz só QuantityMg e CurrentWeightMg. Reservas alheias ficam intactas. Movimentos e estado terminal são gravados na mesma transação; a soma da baixa lógica da execução é o material real positivo.
4. Em Completed, liberar a reserva que sobrar. Em Failed sem reimpressão, liberar a reserva restante. Em Failed com reimpressão, manter a reserva restante, criar uma PrintRun Planned ligada à anterior e devolver o ProductionLot à fila; a Printer segue AwaitingPickup vinculada à execução que falhou.
5. Tentar completar a reserva até PlannedMg, com FIFO e sem complemento parcial. Se faltar só o complemento, confirmar a falha e seu consumo sem desfazer o resto; MissingMg indica o bloqueio.
6. Ao tentar iniciar depois de entrada de material, tentar de novo o complemento integral dentro da transação. Só iniciar com reserva completa e impressora disponível. Falta de saldo recusa o início, preservando o planejamento e as reservas existentes.
7. Repetir encerramento terminal recusa sem movimentos nem reimpressão extra. Falha de infraestrutura em qualquer etapa desfaz a transação inteira; falta de complemento é resultado de negócio, não exceção.

As decisões são regras puras; atomicidade e isolamento vêm de `withTransaction` (research.md item 3): uma transação de escrita exclusiva por vez. Comparação com o limite: AccumulatedSeconds ≥ MaintenanceLimitHours × 3600.

## Compras e financeiro

- **PurchaseOrder**: SupplierId; Number único; Status; OrderedAt; ExpectedAt opcional. Draft → Sent → PartiallyReceived → Received. Cancelled a partir de Draft ou Sent, se nada foi recebido.
- **PurchaseOrderLine**: MaterialId; QuantityMg > 0 (a API recebe quilos); UnitPriceCentsPerKg ≥ 0.
- **PurchaseReceipt**: PurchaseOrderId; ReceivedAt; Notes. **PurchaseReceiptLine**: MaterialLotId; ReceivedWeightMg > 0. "Recebimento com peso zero ou negativo é recusado." Pedido completo quando a soma de ReceivedWeightMg iguala QuantityMg. O lote de material criado recebe CostCentsPerKg = UnitPriceCentsPerKg da linha.
- **Invoice**: SalesOrderId de pedido que não está QuotePending nem Cancelled; Number; AmountCents > 0; IssuedAt; DocumentReference opcional. Não há entidade de nota fiscal.
- **Payment**: SalesOrderId nas mesmas condições; AmountCents > 0; Method; PaidAt; Reference opcional.

## Leitura operacional

- **DeadlineAlert**: RunAt; OverdueCount; DueTodayCount. Atrasado = PromisedDate < hoje e existe lote não Completed e não Cancelled. Vencendo hoje = PromisedDate igual a hoje. "Hoje" é a data no fuso de FarmSettings.TimeZone.
- **RestockSuggestion**: RunAt; MaterialId; AvailableMg; SuggestedOrderMg. Só quando ReorderPointMg não é nulo e o livre do material está abaixo dele. SuggestedOrderMg = ReorderPointMg − livre, mínimo zero.
- **Consumo de sete dias**: soma de QuantityMg de ProductionOut e Waste no intervalo, uma vez por detalhe, sem contar Reserve e Unreserve.
- **AuditLog**: EntityName; EntityId; Action; UserId; At; FromStatus; ToStatus. "Trilha guarda entidade, ação, usuário, momento, estado anterior e estado novo." Leitura: Admin e Production.

## Custo estimado (valor calculado, não tabela)

Entradas: miligramas, centavos por kg, segundos, Wh por hora, centavos por MWh, centavos por hora.

- Filamento = mg × centavos por kg ÷ 1.000.000, ao centavo, metade para cima.
- Energia = segundos × Wh por hora × centavos por MWh ÷ 3.600.000.000, ao centavo, metade para cima.
- Máquina = segundos × centavos por hora ÷ 3.600, ao centavo, metade para cima.
- Total = soma das três parcelas já arredondadas. Só existe se tarifa, custo por kg, taxa e energia por hora estão presentes.
- A resposta inclui a frase: "A taxa de hora-máquina não inclui filamento nem energia."

Backlog = soma de PlannedSeconds ainda não executados, em horas. A previsão declara o calendário vigente, o paralelismo e a compatibilidade. Aproximação "horas ÷ máquinas equivalentes" só com a frase de que as capacidades foram tratadas como equivalentes.
