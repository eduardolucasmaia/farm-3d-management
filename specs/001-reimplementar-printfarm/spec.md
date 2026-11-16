# Feature Specification: Reimplementar o núcleo da farm

**Feature Branch**: `001-reimplementar-printfarm`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Reimplementar o software de referência em docs_apoio/software_ref (ERP/MES de impressão 3D) seguindo o speckit e a constituição do Farm 3D."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedido aprovado vira lotes na fila (Priority: P1)

Vendas confirma um pedido. Produção libera a linha e o sistema corta a quantidade em lotes de produção que cabem na prancha, reserva o material por inteiro e coloca os lotes na fila. Impressora incompatível não recebe o lote.

**Why this priority**: Sem esse corte, o pedido não vira trabalho e a farm continua no papel. É o menor demonstrável que já entrega capacidade real.

**Independent Test**: Com modelos, estoque e impressoras já semeados, aprovar um pedido de 10 peças de um modelo com 4 peças por prancha e ver 3 lotes na fila, com a terceira prancha na metade do tempo e do material. Tentar a mesma fila numa impressora incompatível e ver a recusa, sem reserva pela metade quando falta material.

**Acceptance Scenarios**:

1. **Given** um modelo com 4 peças por prancha, tempo e material de prancha cadastrados, estoque livre que cobre as 10 peças e uma impressora compatível, **When** vendas confirma um pedido de 10 peças e produção libera a linha, **Then** existem 3 lotes de produção (4, 4 e 2 peças), os dois primeiros com tempo e material de uma prancha cheia e o terceiro com metade, e os três ficam na fila.
2. **Given** o mesmo pedido com saldo livre menor que o material do primeiro lote, **When** produção tenta liberar, **Then** a liberação é recusada, nenhum lote fica parcialmente reservado e a fila não muda.
3. **Given** um lote liberado e uma impressora cuja lista de materiais não contém o material do lote, **When** produção coloca esse lote nessa impressora, **Then** a fila recusa a atribuição e o lote não entra nessa máquina.
4. **Given** uma impressora sem lista de materiais, **When** produção enfileira um lote de qualquer material nela, **Then** a atribuição é aceita.
5. **Given** um pedido ainda em confirmação pendente, **When** produção tenta gerar lotes, **Then** nenhum lote de produção é criado.
6. **Given** dois lotes de material do mesmo insumo, o mais antigo com saldo livre e o mais novo também, **When** a liberação reserva, **Then** o mais antigo é consumido na reserva antes do mais novo.
7. **Given** um lote já reservado, **When** a mesma liberação é repetida, **Then** a segunda reserva é recusada e o saldo reservado não dobra.

---

### User Story 2 - Manter a base da operação (Priority: P2)

Admin, vendas, produção e compras mantêm clientes, fornecedores, modelos, materiais, cores, arquivos, perfis de produção, impressoras e operadores. Cada papel só mexe no que é da sua função. Quem não entrou não vê a operação.

**Why this priority**: A história 1 pode ser provada com dados semeados. A farm real precisa cadastrar sem planilha.

**Independent Test**: Entrar com cada papel, criar um modelo habilitado com cor, tamanho e perfil (peças, tempo e material por prancha) e uma impressora com limite de horas de manutenção e lista de materiais. Vendas não grava impressora. Operador não grava cliente.

**Acceptance Scenarios**:

1. **Given** um usuário sem sessão, **When** abre um cadastro, **Then** a operação pede identificação e não mostra dados.
2. **Given** vendas autenticado, **When** grava um cliente e um modelo com preço de venda, cores e tamanhos oferecidos, **Then** o modelo habilitado aparece para novo pedido e o preço de venda fica distinto de qualquer custo.
3. **Given** produção autenticado, **When** grava uma impressora sem limite de horas de manutenção, **Then** o cadastro é recusado.
4. **Given** compras autenticado, **When** tenta alterar um pedido de venda, **Then** a alteração é recusada.
5. **Given** admin, **When** cria um usuário e marca o papel Operador, **Then** esse usuário entra só com as ações de operador.

---

### User Story 3 - Orçamento vira no máximo um pedido (Priority: P2)

Vendas monta um orçamento com linhas, envia, aprova, rejeita ou deixa expirar. Aprovar e gerar pedido acontece uma vez. A listagem mostra a composição das linhas.

**Why this priority**: O pedido da história 1 nasce de um orçamento na operação comercial. A conversão duplicada cria produção dobrada.

**Independent Test**: Criar orçamento, aprovar, gerar pedido com data prometida e tentar gerar de novo. Em outro orçamento, rejeitar e, num terceiro com validade vencida, ver que nenhum dos dois gera pedido.

**Acceptance Scenarios**:

1. **Given** um orçamento em rascunho com linhas, **When** vendas marca como enviado e depois aprova, **Then** o estado fica aprovado e a composição mostra produto, material, quantidade e subtotal de cada linha.
2. **Given** um orçamento aprovado com validade vigente, **When** vendas gera pedido informando a data prometida, **Then** nasce um pedido confirmado e o orçamento fica em pedido gerado.
3. **Given** um orçamento já em pedido gerado, **When** vendas tenta gerar outro pedido, **Then** a segunda geração é recusada e continua existindo um único pedido.
4. **Given** um orçamento aprovado sem data prometida na geração, **When** vendas tenta gerar o pedido, **Then** o pedido não nasce.
5. **Given** um orçamento em rascunho, enviado ou aprovado, **When** vendas rejeita com um motivo, **Then** o estado fica rejeitado, o motivo fica nas observações e não há geração de pedido.
6. **Given** um orçamento em rascunho, enviado ou aprovado cuja validade já passou, **When** o processamento periódico roda, **Then** o estado fica expirado e não há geração de pedido. Rejeitado e pedido gerado não são expirados por esse processamento.
7. **Given** um pedido criado manualmente, **When** ele ainda está em confirmação pendente, **Then** não admite lote de produção, fatura nem pagamento, e a confirmação só o leva a confirmado ou a cancelado. Cancelado não muda mais.

---

### User Story 4 - Compra entra em lote de material (Priority: P2)

Compras pede material em quilos, recebe em gramas e o saldo fica disponível para a reserva da história 1. O ponto de reposição fica visível quando o livre cai abaixo do cadastrado.

**Why this priority**: A reserva FIFO só é verdadeira se a entrada do material também for rastreada. O dado semeado da história 1 não substitui o recebimento.

**Independent Test**: Criar pedido de compra, receber uma parte, ver lote de material e saldo, receber o resto, e conferir que a reserva seguinte usa o lote mais antigo.

**Acceptance Scenarios**:

1. **Given** um fornecedor e um material, **When** compras cria um pedido de compra em quilos com preço e registra o recebimento em gramas, **Then** nasce um lote de material com peso inicial, peso atual e custo por grama, e o saldo livre aumenta o peso recebido.
2. **Given** um recebimento parcial, **When** compras consulta o pedido, **Then** o estado é parcialmente recebido até o recebimento que completa a quantidade, quando passa a recebido.
3. **Given** dois recebimentos do mesmo material em momentos diferentes, **When** produção libera um lote de produção, **Then** a reserva começa pelo lote de material recebido primeiro.
4. **Given** um material com ponto de reposição e saldo livre abaixo desse ponto, **When** o processamento periódico roda, **Then** existe uma sugestão de recompra com o saldo livre e a quantidade sugerida. Material sem ponto de reposição não gera sugestão.

---

### User Story 5 - Executar sem liberar a máquina cedo (Priority: P3)

O operador inicia, pausa, conclui ou falha a impressão. Ao concluir a impressão, o lote fica aguardando retirada e a impressora continua ocupada. Só depois da retirada e da preparação, e sem manutenção vencida, a máquina volta a ficar disponível. Falha sem reimpressão devolve a reserva restante. Falha com reimpressão mantém a reserva e abre outra execução.

**Why this priority**: A fila da história 1 ainda não é chão de fábrica. O princípio dos dois estados só aparece nesta jornada.

**Independent Test**: Concluir uma impressão e ver a máquina ainda ocupada; confirmar retirada e preparação e só então vê-la disponível. Repetir com horas acumuladas no limite e ver manutenção no lugar de disponível. Falhar sem reimpressão e conferir a reserva devolvida; falhar com reimpressão e conferir a reserva mantida.

**Acceptance Scenarios**:

1. **Given** um lote na fila e uma impressora disponível e compatível, **When** o operador inicia a execução, **Then** o lote fica em impressão e a impressora fica em impressão. Iniciar de novo a mesma execução é recusado.
2. **Given** uma execução em impressão, **When** o operador pausa e depois retoma, **Then** o lote fica pausado e volta a em impressão, e o tempo pausado fica acumulado.
3. **Given** uma execução em impressão, **When** o operador conclui, **Then** o lote fica aguardando retirada, a impressora fica aguardando retirada, o material informado sai do estoque uma única vez e uma segunda conclusão é recusada.
4. **Given** a impressora aguardando retirada depois de uma impressão concluída, **When** o operador confirma a retirada e ainda não a preparação, **Then** o lote de produção fica concluído, a impressora fica em preparação e não aceita outro lote. Se a execução tinha falhado, o lote permanece em falha e só a impressora segue para preparação.
5. **Given** a preparação concluída e horas acumuladas abaixo do limite, **When** o operador encerra a preparação, **Then** a impressora fica disponível.
6. **Given** horas acumuladas iguais ou maiores que o limite cadastrado, **When** a preparação termina, **Then** a impressora fica em manutenção e não inicia outra impressão. Confirmar a manutenção com uma nota zera as horas acumuladas e, sem outro bloqueio, devolve a impressora a disponível.
7. **Given** uma execução em impressão ou pausada, **When** o operador falha sem pedir reimpressão, **Then** o lote fica em falha, a reserva restante volta ao saldo livre e a impressora não fica disponível: segue para retirada do que houver na mesa.
8. **Given** uma execução em impressão ou pausada, **When** o operador falha pedindo reimpressão, **Then** o lote volta para a fila, a reserva permanece e nasce uma execução nova planejada, ligada à que falhou.
9. **Given** uma execução já concluída ou já falha, **When** alguém tenta falhar de novo, **Then** o pedido é recusado.

---

### User Story 6 - Registrar fatura e pagamento do pedido (Priority: P3)

Vendas lança a fatura e os pagamentos do pedido confirmado, com valor, data e meio. Isso não emite nota fiscal nem cobra em banco.

**Why this priority**: O financeiro do referência é registro, não fiscal. Fecha o ciclo do pedido sem abrir integração.

**Independent Test**: Num pedido confirmado, lançar uma fatura e um pagamento em Pix e ver os dois ligados ao pedido. Tentar o mesmo num pedido em confirmação pendente e ver a recusa. O documento emitido não é nota fiscal.

**Acceptance Scenarios**:

1. **Given** um pedido confirmado, **When** vendas registra uma fatura com número, valor e data, **Then** a fatura fica ligada a esse pedido e pode levar uma referência externa opcional.
2. **Given** o mesmo pedido, **When** vendas registra um pagamento com valor, meio (dinheiro, cartão, Pix, transferência ou outro) e data, **Then** o pagamento fica ligado ao pedido.
3. **Given** um pedido em confirmação pendente ou cancelado, **When** vendas tenta faturar ou pagar, **Then** o lançamento é recusado.
4. **Given** uma fatura registrada, **When** alguém procura uma nota fiscal eletrônica gerada pelo sistema, **Then** não existe emissão fiscal.

---

### User Story 7 - Ver prazo, custo e carga com a premissa (Priority: P3)

Gestão abre o painel e vê pedidos atrasados, os que vencem hoje, o que está em produção, quais máquinas estão em impressão, o consumo de material em sete dias, o custo estimado com a conta visível e o backlog em horas. Falta de tarifa não vira número inventado.

**Why this priority**: O brief exige estimativa explícita. O referência exige atraso e recompra visíveis. Os dois se encontram neste painel.

**Independent Test**: Com um pedido prometido para ontem, uma máquina em impressão e tarifa de energia preenchida, o painel mostra o atraso, a máquina e o custo com filamento, energia e hora-máquina separados. Apagar a tarifa e ver a lacuna no lugar de um total.

**Acceptance Scenarios**:

1. **Given** um pedido confirmado com data prometida anterior a hoje e lotes ainda não concluídos, **When** gestão abre o painel, **Then** esse pedido conta como atrasado.
2. **Given** um pedido com data prometida hoje, **When** gestão abre o painel, **Then** esse pedido conta como vencendo hoje.
3. **Given** impressoras em impressão, **When** gestão abre o painel, **Then** a lista mostra essas máquinas e não as que estão só aguardando retirada.
4. **Given** tarifa de energia, preço por grama e taxa de hora-máquina cadastrados, **When** o painel mostra o custo estimado de um lote, **Then** a conta aparece separada em filamento, energia e hora-máquina, e a taxa declara que não inclui os dois primeiros.
5. **Given** tarifa de energia ausente, **When** o painel mostraria o custo, **Then** mostra a premissa que falta e não mostra um total.
6. **Given** lotes ainda não executados em máquinas de capacidade equivalente, **When** o painel mostra a previsão de término, **Then** declara que a conta é horas pendentes distribuídas em paralelo no calendário cadastrado, respeitando compatibilidade. O calendário vigente aparece junto.
7. **Given** exemplos de volume, custo ou prazo, **When** aparecem na tela, **Then** estão marcados como fictícios.

---

### User Story 8 - Auditar quem mudou o estado (Priority: P4)

Cada mudança de estado de orçamento, pedido, lote de produção e impressora fica registrada com a pessoa, o momento e o estado anterior e o novo.

**Why this priority**: O rastreio é princípio. Não bloqueia vender nem produzir, e por isso fecha a fila.

**Independent Test**: Confirmar um pedido, liberar um lote e concluir uma retirada. Os três eventos aparecem na trilha com autor e estados. Um ajuste de estoque também aparece como movimentação, não só como saldo novo.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** muda o estado de um orçamento, pedido, lote de produção ou impressora, **Then** a trilha guarda entidade, ação, usuário, momento, estado anterior e estado novo.
2. **Given** uma reserva, um consumo ou uma devolução de reserva, **When** o saldo muda, **Then** existe movimentação com quantidade em gramas, custo unitário e origem (lote de produção, execução ou recebimento).
3. **Given** um usuário sem papel de admin ou produção, **When** tenta ler a trilha completa, **Then** o acesso é recusado.

---

### Edge Cases

- Quantidade de peças que não fecha prancha inteira: a última prancha usa a fração peças / peças por prancha. 10 peças com 4 por prancha geram pranchas de 4, 4 e 2; a terceira leva metade do tempo e metade do material.
- Peças por prancha ausentes ou menores que 1 impedem a liberação.
- Pedido com quantidade zero ou negativa é recusado.
- Cor ou tamanho é obrigatório só quando o modelo oferece essa opção. A escolha fica gravada na linha.
- Impressora inativa ou indisponível não entra na fila.
- Dois lotes não ocupam a mesma impressora ao mesmo tempo.
- Orçamento sem validade não expira pelo processamento periódico.
- Recebimento com peso zero ou negativo é recusado.
- Conclusão de execução sem material real informado é recusada; o estimado não é lançado no lugar do real em silêncio.
- Falha pede um motivo da lista fechada: nenhum, aderência à mesa, entupimento, deslocamento de camada, falta de material, outro.
- Reimpressão não nasce de execução que não esteja em impressão ou pausada.
- Pedido cancelado é imutável. Não volta a confirmação pendente.
- Moeda e quantidades de material em grama na operação; compra é pedida em quilos e recebida em gramas (1 kg = 1000 g).
- Arredondamento de dinheiro é no centavo mais próximo, metade para cima. Gramas reservadas guardam até três casas e não arredondam para esconder falta de saldo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST identificar a pessoa por e-mail e senha e MUST restringir cada ação a um ou mais papéis: Admin, Vendas, Produção, Compras e Operador. Ação sem sessão MUST ser recusada, exceto a identificação.
- **FR-002**: Admin MUST poder criar usuários e atribuir um desses papéis. Produção MUST poder listar usuários só para vincular operador.
- **FR-003**: O sistema MUST permitir o cadastro de clientes, fornecedores, modelos, materiais, cores, arquivos com versão, perfis de produção, impressoras e operadores, com os campos descritos em Key Entities.
- **FR-004**: Um modelo MUST guardar preço de venda distinto de custo. Um perfil de produção MUST guardar peças por prancha, minutos por prancha e gramas por prancha, todos maiores que zero, para que a liberação seja possível.
- **FR-005**: Uma impressora MUST ter limite de horas de manutenção maior que zero, taxa de hora-máquina e a declaração de que essa taxa não inclui filamento nem energia. A lista de materiais compatíveis MAY estar vazia; vazia significa aceitar qualquer material.
- **FR-006**: Vendas MUST poder criar orçamento em rascunho, marcar enviado, aprovar a partir de rascunho ou enviado, e rejeitar a partir de rascunho, enviado ou aprovado, guardando o motivo nas observações.
- **FR-007**: O processamento periódico MUST marcar como expirado o orçamento em rascunho, enviado ou aprovado cuja validade já passou. MUST NOT expirar rejeitado nem pedido gerado. Orçamento sem validade MUST NOT expirar por esse meio.
- **FR-008**: Gerar pedido a partir de orçamento MUST exigir orçamento aprovado, validade não vencida e data prometida. O pedido nasce confirmado. O orçamento passa a pedido gerado. Uma segunda geração do mesmo orçamento MUST ser recusada.
- **FR-009**: Pedido criado manualmente MUST nascer em confirmação pendente. Desse estado só MUST ir para confirmado ou cancelado. Cancelado MUST ser imutável. Confirmação pendente MUST NOT gerar lote de produção, fatura nem pagamento.
- **FR-010**: A listagem de orçamentos MUST mostrar a composição de cada linha: modelo, material, quantidade, preço unitário e subtotal.
- **FR-011**: Ao liberar uma linha de pedido confirmado, o sistema MUST criar lotes de produção pelo teto de peças / peças por prancha. A prancha incompleta MUST usar tempo e material proporcionais. O cenário 10 peças e 4 por prancha MUST produzir 3 lotes, o último com metade do tempo e metade do material da prancha cheia.
- **FR-012**: Liberar MUST reservar, de uma vez, as gramas do lote no lote de material mais antigo com saldo livre. Saldo insuficiente MUST recusar a liberação inteira desse lote, sem reserva parcial. Repetir a liberação já reservada MUST ser recusado.
- **FR-013**: Enfileirar com impressora, ou iniciar execução, MUST recusar impressora inativa, indisponível, ocupada ou incompatível com o material.
- **FR-014**: O estado do lote de produção e o estado da impressora MUST mudar pelos eventos desta spec e MUST NOT ser inferidos um do outro. Concluir a impressão MUST deixar o lote aguardando retirada e a impressora aguardando retirada.
- **FR-015**: A impressora só MUST voltar a disponível depois da retirada confirmada e da preparação concluída, e somente se as horas acumuladas estiverem abaixo do limite e ela não estiver indisponível. A retirada depois de uma execução concluída MUST marcar o lote como concluído. A retirada depois de uma falha MUST deixar o lote em falha.
- **FR-016**: Ao atingir o limite de horas, a impressora MUST entrar em manutenção no fim da preparação e MUST NOT iniciar outra impressão. Confirmar a manutenção MUST exigir uma nota, MUST zerar as horas acumuladas e MUST devolver a impressora a disponível se não houver outro bloqueio.
- **FR-017**: Concluir uma execução MUST lançar uma única saída de estoque com a quantidade real informada. Segunda conclusão MUST ser recusada. Quantidade real omitida MUST recusar a conclusão.
- **FR-018**: Falhar MUST ser possível só em execução em impressão ou pausada, com motivo na lista fechada. Sem reimpressão, o lote vai a falha e a reserva restante volta ao livre. Com reimpressão, o lote volta à fila, a reserva permanece e nasce execução nova ligada à anterior.
- **FR-019**: Compras MUST registrar pedido de compra em quilos e recebimento em gramas, criando lote de material, saldo e movimentação de entrada. Pedido de compra MUST refletir rascunho, enviado, parcialmente recebido, recebido e cancelado.
- **FR-020**: O sistema MUST sugerir recompra quando o saldo livre do material ficar abaixo do ponto de reposição cadastrado. Sem ponto de reposição, não há sugestão.
- **FR-021**: Vendas MUST registrar fatura e pagamento ligados a pedido confirmado, sem emissão fiscal e sem cobrança bancária. Meios de pagamento MUST ser dinheiro, cartão, Pix, transferência ou outro.
- **FR-022**: O painel MUST mostrar atrasados, vencendo hoje, em produção, impressoras em impressão e consumo de material nos últimos sete dias.
- **FR-023**: O custo estimado MUST ser filamento × preço por grama + energia estimada × tarifa + tempo × taxa de hora-máquina, com as três parcelas visíveis. Premissa ausente MUST impedir o total. Backlog e previsão MUST declarar calendário, paralelismo e compatibilidade.
- **FR-024**: Mudança de estado de orçamento, pedido, lote de produção e impressora MUST gerar trilha com usuário, momento, estado anterior e estado novo. Movimento de estoque MUST guardar tipo, gramas, custo unitário e origem.
- **FR-025**: Exemplos numéricos de volume, custo ou prazo MUST aparecer marcados como fictícios.
- **FR-026**: O sistema MUST NOT emitir nota fiscal, boleto, cobrança de gateway, cotação de frete, telemetria de impressora, otimização automática da fila nem assistente de conversa. Frete e embalagem no pedido são valores digitados.

### Key Entities

- **Usuário**: e-mail, nome, papel, senha guardada de forma irreversível.
- **Cliente**: nome, contato, endereço.
- **Fornecedor**: nome, contato, condições de pagamento em texto, prazo médio em dias.
- **Cor**: nome e cor opcional em hexadecimal.
- **Material**: nome, tipo (filamento, resina, peça de reposição, embalagem, outro), marca, diâmetro, cor, custo de referência por quilo, ponto de reposição em gramas.
- **Lote de material**: material, fornecedor, código, data de recebimento, peso inicial e atual em gramas, custo por grama.
- **Saldo**: material, lote de material opcional, quantidade em gramas, quantidade reservada em gramas. Livre = quantidade − reservada.
- **Movimentação**: entrada de compra, saída de produção, ajuste, reserva, liberação de reserva ou desperdício; gramas; custo unitário; origem.
- **Arquivo 3D**: nome e versões com rótulo.
- **Perfil de produção**: nome, material opcional, peças por prancha, minutos por prancha, gramas por prancha.
- **Modelo**: nome, SKU, preço de venda, perfil, material padrão, arquivo, cores oferecidas, tamanhos oferecidos, habilitado para venda.
- **Orçamento**: número, cliente, estado, validade opcional, linhas, total, observações.
- **Linha de orçamento**: modelo, quantidade, preço unitário, material opcional.
- **Pedido**: número, cliente, orçamento de origem opcional, estado comercial, data prometida, frete digitado, embalagem digitada, linhas.
- **Linha de pedido**: modelo, quantidade, preço unitário, material, cor escolhida, tamanho escolhido.
- **Lote de produção**: pedido, linha, modelo, material, peças planejadas, peças concluídas, estado, gramas planejadas, minutos planejados.
- **Reserva de material**: lote de produção, saldo, gramas reservadas.
- **Item de fila**: lote de produção, impressora opcional, prioridade, posição.
- **Impressora**: nome, modelo, volume, taxa de hora-máquina, energia por hora, limite de horas de manutenção, horas acumuladas, minutos de preparação, materiais compatíveis, estado operacional, ativa ou não.
- **Operador**: nome e usuário opcional.
- **Execução**: lote de produção, impressora, operador, estado, início, fim, segundos pausados, motivo de falha, material real, minutos reais, lote de material, execução de origem quando for reimpressão.
- **Pedido de compra**: fornecedor, número, estado, linhas em quilos e preço.
- **Recebimento**: pedido de compra, momento, linhas com lote de material e peso em gramas.
- **Fatura**: pedido, número, valor, data, referência opcional.
- **Pagamento**: pedido, valor, meio, data, referência opcional.
- **Parâmetros da farm**: tarifa de energia, calendário de operação, marca de dado fictício ligada aos exemplos.
- **Alerta de prazo**: momento da apuração, quantidade atrasada, quantidade que vence hoje.
- **Sugestão de recompra**: material, saldo livre, quantidade sugerida, momento da apuração.
- **Trilha**: entidade, ação, usuário, momento, estado anterior, estado novo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com cadastros e saldo já existentes, uma pessoa de vendas e uma de produção colocam na fila os 3 lotes de um pedido de 10 peças (4 por prancha) em menos de 5 minutos.
- **SC-002**: Em 100% das tentativas com saldo insuficiente, a liberação não deixa reserva parcial.
- **SC-003**: Em 100% das tentativas, lote não entra em impressora incompatível, inativa, indisponível ou já ocupada.
- **SC-004**: Em 100% das impressões concluídas na prova, a máquina só aparece disponível depois da retirada e da preparação, e não aparece disponível se a manutenção estiver vencida.
- **SC-005**: Cada orçamento gera no máximo um pedido. A segunda tentativa é recusada em 100% dos casos da prova.
- **SC-006**: O recebimento aumenta o saldo livre exatamente no peso recebido, e a reserva seguinte usa primeiro o lote de material mais antigo.
- **SC-007**: O painel lista todos os pedidos de prova com data prometida vencida e lotes em aberto, e omite o total de custo quando falta uma premissa.
- **SC-008**: Uma pessoa que vê o painel de exemplo consegue apontar a marca de dado fictício sem ajuda, e nenhum número de exemplo é apresentado como ganho medido.
- **SC-009**: Usuários piloto percorrem pedido confirmado, lote na fila e execução concluída sem planilha paralela obrigatória.

## Assumptions

- O produto reimplementado é o núcleo descrito no software de referência (cadastros, comercial, produção, estoque, compras, financeiro simplificado e painel), mais as regras da constituição: prancha, dois estados, custo explícito e dado fictício.
- Kanban é interno. Não há quadro externo como fonte dos estados.
- Início e fim de impressão são confirmados por pessoa. Não há leitura da máquina.
- Tempo e material nascem do perfil de produção digitado. Não há importação de fatiador nesta entrega.
- Calendário inicial: segunda a sexta, 08:00–18:00, no fuso da farm, configurável. A previsão mostra esse calendário como premissa.
- Preparação é um único tempo em minutos cadastrado na impressora, depois da retirada, antes da máquina aceitar outro lote. Não separa troca de material, de bico ou de máquina.
- Tamanho não muda peças por prancha nesta entrega. Ele fica registrado na linha quando o modelo oferece tamanhos.
- O limite de manutenção é obrigatório no cadastro da impressora e não tem número padrão de fábrica. A confirmação pede uma nota e não uma lista de tarefas.
- Falha e reimpressão entram porque o referência já as trata como parte da execução.
- Usuários iniciais existem para os cinco papéis, e admin consegue criar outros. O referência não tinha tela de criação; sem ela a reimplementação não opera.
- Frete e embalagem são valores digitados. Pagamento é lançamento, não cobrança.
- Exemplos de tela usam a marca de dado fictício. Metas numéricas de ganho da operação real ficam fora até haver série medida.
- Fora desta especificação: nota fiscal, boleto, banco, e-commerce, RH, qualidade industrial, CNC, telemetria, otimização automática da fila e assistente de conversa.
- Retenção de dados pessoais segue a política do controlador da farm. O sistema guarda o mínimo para operar pedido, produção e trilha.
