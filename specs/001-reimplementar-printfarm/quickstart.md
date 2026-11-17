# Quickstart: Reimplementar o núcleo da farm

Prova executável das histórias de `spec.md`, revisada em 2026-11-17 com os cenários das clarificações. Números de exemplo são fictícios.

## Pré-requisitos

- Node.js 24 LTS ou mais novo (`node --version`)
- Nada mais: sem .NET, sem Docker, sem servidor de banco. O banco é um arquivo SQLite em `data/farm3d.db`.

Na raiz do repositório:

```powershell
copy .env.example .env
# preencher JWT_SIGNING_KEY (32 caracteres ou mais) e FARM3D_SEED_PASSWORD
# a senha de semente segue a política: 6+ caracteres, maiúscula, minúscula, dígito e símbolo
npm install
npm test
npm run typecheck
npm run db:migrate --workspace server
npm run dev --workspace server
```

Noutro terminal:

```powershell
npm run dev --workspace web
```

Para recomeçar do zero, apague `data/farm3d.db` e rode `npm run db:migrate --workspace server` de novo.

A API sobe em `http://localhost:5088`. A SPA em `http://localhost:5173`. Usuários semeados em Development: `admin@farm3d.local`, `vendas@farm3d.local`, `producao@farm3d.local`, `compras@farm3d.local`, `operador@farm3d.local`. A senha é a de `FARM3D_SEED_PASSWORD`. A semente só roda com `NODE_ENV=development`.

Os testes automatizados MUST estar verdes antes das seções manuais. Cada seção vale sozinha se a semente da história estiver aplicada.

## 1. Pedido aprovado vira 3 lotes (US1)

Semente fictícia: modelo "Suporte demo (fictício)", 4 peças por prancha, 60 minutos e 40 g por prancha, dois lotes de material do mesmo insumo (o mais antigo com saldo), impressora "Mesa A" compatível e "Mesa B" incompatível.

1. Entrar como `vendas@farm3d.local` e confirmar um pedido de 10 peças desse modelo, cor e tamanho oferecidos, data prometida daqui a sete dias.
2. Entrar como `producao@farm3d.local` e liberar os lotes.
3. Esperado: 3 lotes, peças 4, 4 e 2. Minutos 60, 60 e 30. Gramas 40, 40 e 20. Os três na fila. A reserva começa pelo lote de material mais antigo.
4. Enfileirar o primeiro lote na "Mesa B". Esperado: recusa, lote continua sem essa máquina.
5. Repetir a liberação. Esperado: recusa, reserva não dobra.
6. Com a semente de um segundo pedido sem saldo livre suficiente (`PED-DEMO-002`), liberar a linha. Esperado: recusa sem reserva parcial, novos lotes ou itens de fila para a linha.
7. Depois da liberação do primeiro pedido, editar o perfil para 5 peças, 90 minutos e 50 g por prancha. Esperado: os lotes já liberados continuam 4/4/2 peças, 60/60/30 minutos e 40/40/20 g, com os parâmetros originais 4/60/40 preservados. A reserva não muda. Depende da edição de perfil (US2); até lá, provado pelo teste de orquestração.
8. Liberar um pedido novo de 10 peças. Esperado: 2 lotes de 5 peças, 90 minutos e 50 g cada. A reimpressão do pedido anterior continua usando os parâmetros originais (provada na US5).

`npm test --workspace server` cobre o corte 10/4, a recusa por saldo e a incompatibilidade sem abrir o navegador.

## 2. Papéis e cadastros (US2)

1. Sem entrar, abrir a fila. Esperado: volta para a identificação.
2. Como `vendas@farm3d.local`, gravar um cliente e um modelo habilitado com preço de venda. Esperado: o modelo aparece para pedido. Tentar gravar impressora. Esperado: recusa.
3. Como `producao@farm3d.local`, gravar impressora sem limite de horas. Esperado: recusa. Gravar com limite 200 horas, taxa de hora-máquina e a frase de que a taxa não inclui filamento nem energia.
4. Como `admin@farm3d.local`, criar `operador2@farm3d.local` com papel Operator. Entrar com ele e tentar gravar cliente. Esperado: recusa.

## 3. Orçamento uma vez só (US3)

1. Como vendas, criar orçamento em rascunho com uma linha, marcar enviado, aprovar. A composição mostra modelo, material, quantidade e subtotal.
2. Gerar pedido com data prometida. Esperado: pedido confirmado, orçamento em pedido gerado.
3. Gerar de novo. Esperado: recusa e um único pedido.
4. Rejeitar outro orçamento com motivo. Esperado: motivo nas observações e nenhuma geração.
5. Aprovar um terceiro com validade no passado e esperar o processamento horário (ou rodar `npm run job:hourly --workspace server`, que dispara uma passagem). Esperado: expirado, sem pedido.
6. Criar pedido manual. Esperado: confirmação pendente. Liberar lote, faturar ou pagar. Esperado: as três recusas. Confirmar o pedido. Esperado: confirmado. Cancelar outro ainda pendente e tentar mudar seu estado. Esperado: recusa.
7. Num pedido confirmado com lotes na fila, sem execução iniciada, fatura ou pagamento, anotar o total reservado e cancelar como Vendas. Esperado: pedido e lotes pendentes Cancelled, fila removida, reservas zeradas e saldo livre aumentado exatamente pelo valor liberado, com movimentos Unreserve.
8. Em três pedidos independentes, registrar respectivamente uma execução iniciada, uma fatura e um pagamento. Tentar cancelar cada um. Esperado: 409 `ORDER_CANCELLATION_BLOCKED` com o impedimento correto, sem alterar pedido, lotes, fila ou reservas. Encerrar a execução do primeiro e repetir: continua recusado.

## 4. Compra e recebimento (US4)

1. Como `compras@farm3d.local`, criar pedido de 1 kg de filamento e receber 400 g com código de lote. Esperado: lote de material com 400 g, pedido parcialmente recebido, custo por grama = preço do quilo / 1000.
2. Receber 0 g. Esperado: recusa.
3. Receber os 600 g restantes. Esperado: pedido recebido.
4. Material com ponto de reposição acima do livre, depois de uma passagem periódica (`npm run job:hourly --workspace server`). Esperado: sugestão com o saldo livre e a diferença até o ponto.

## 5. Dois estados (US5)

1. Como `operador@farm3d.local`, iniciar o primeiro lote da seção 1 na "Mesa A". Esperado: lote em impressão e máquina em impressão.
2. Pausar e retomar. Esperado: o lote pausa e volta; a máquina permanece em impressão.
3. Concluir informando as gramas reais. Esperado: lote aguardando retirada, máquina aguardando retirada, uma saída de estoque. Concluir de novo. Esperado: recusa.
4. Confirmar a retirada. Esperado: lote concluído, máquina em preparação, sem aceitar outro lote.
5. Concluir a preparação com horas abaixo do limite. Esperado: máquina disponível.
6. Repetir uma impressão que leve as horas acumuladas ao limite. No fim da preparação, esperado: em manutenção, e um início novo é recusado. Confirmar a manutenção com uma nota. Esperado: horas zeradas e máquina disponível.
7. Numa semente com 40 g reservados, falhar sem reimpressão informando 10 g reais. Esperado: uma baixa Waste de 10 g, liberação dos 30 g restantes, lote em falha e máquina aguardando retirada. Repetir a falha ou concluir essa execução: recusa sem saída adicional.
8. Noutra semente com 40 g reservados e 10 g livres, falhar com reimpressão informando 10 g. Esperado: execução anterior em falha, nova planejada ligada à anterior, lote na fila, 30 g de reserva restante mais complemento automático de 10 g. A impressora continua aguardando retirada; retirar leva só a impressora a preparação.

### Material real e reimpressão

Cada linha usa uma semente fictícia independente. Saldo livre exclui reservas de outros lotes de produção. Os testes de domínio começam vermelhos; os de orquestração provam os saldos gravados.

| Caso | Ação | Resultado esperado |
|------|------|--------------------|
| Falha com zero | Informar 0 g numa execução em impressão e repetir a tentativa | Primeira falha registrada sem saída; repetição recusada sem nova reimpressão nem baixa. |
| Dado ausente ou negativo | Falhar omitindo o material ou informando -1 g | 400; execução, estados, reserva e saldo intactos. |
| Complemento insuficiente | Reserva 40 g, livre 5 g, consumo 10 g, pedir reimpressão | Falha e Waste de 10 g confirmados; reserva restante 30 g; os 5 g livres não são reservados em parte; faltam 10 g; início recusado. |
| Recuperação do complemento | No caso anterior, receber material e tentar iniciar depois de retirar e preparar a máquina | Complemento automático de 10 g FIFO; reserva de 40 g; a execução planejada existente inicia. |
| Excesso com saldo | Reserva 40 g; livre em dois lotes com 5 g e 10 g; concluir ou falhar com 50 g | Baixa de 50 g: 40 g da reserva própria, 5 g do lote livre mais antigo e 5 g do seguinte; custo por origem; reservas alheias intactas. |
| Consumo insuficiente | Reserva 40 g, livre 5 g, tentar concluir ou falhar com 50 g | 409; nada muda em execução, lote, impressora, reserva, saldo ou movimentos. |
| Consumo menor na conclusão | Reserva 40 g, concluir com 25 g | ProductionOut de 25 g e liberação dos 15 g restantes. |
| Perfil alterado | Reimprimir lote da seção 1 depois de editar o perfil | Parâmetros, gramas e minutos planejados continuam os da liberação original. |

### Atomicidade e concorrência

Provas em `server/tests/application/`, com SQLite real: em memória para rollback e num arquivo temporário com duas conexões para as disputas. Sincronização explícita entre as operações, sem depender de atraso arbitrário.

- Forçar uma falha entre a gravação do movimento e a do estado. Confirmar rollback de execução, reserva, saldo e trilha, inclusive com mais de um lote de material.
- Disputar o mesmo saldo livre em duas liberações ou dois consumos. Nunca saldo negativo nem consumo de reserva alheia; a operação que perde é recusada sem efeito parcial.
- Duas conclusões, ou uma conclusão e uma falha, para a mesma execução. Só um encerramento é confirmado; a soma dos movimentos terminais é o material real desse encerramento.
- Cancelamento disputando com início de execução, fatura e pagamento, em testes separados. Nunca confirmar o cancelamento junto da ação que o impediria; nenhuma reserva liberada duas vezes.
- Falha com reimpressão em que falta só o complemento: a transação grava a falha e o consumo, mas nem reserva parcial nem segunda execução planejada.

## 6. Fatura e pagamento (US6)

1. No pedido confirmado da seção 1, como vendas, lançar fatura com número, valor e data, e um pagamento Pix.
2. Esperado: os dois ligados ao pedido. Não existe ação de nota fiscal nem de boleto.
3. No pedido em confirmação pendente da seção 3, as mesmas ações. Esperado: recusa.

## 7. Painel (US7)

1. Como `producao@farm3d.local`, abrir o painel com um pedido prometido para ontem e lotes em aberto. Esperado: conta como atrasado. O calendário vigente aparece junto.
2. Máquina em impressão aparece na lista. Máquina só aguardando retirada não aparece.
3. Com tarifa, preço por grama, energia por hora e taxa preenchidos, o custo do lote mostra filamento, energia e hora-máquina separados, mais a frase "A taxa de hora-máquina não inclui filamento nem energia."
4. Limpar a tarifa. Esperado: total vazio e a premissa listada como ausente.
5. Todo exemplo na tela traz a marca de dado fictício.
6. Com consumo de produção e Waste de falhas nos últimos sete dias, o painel soma os dois uma única vez e ignora Reserve e Unreserve.

## 8. Trilha (US8)

1. Como admin, abrir a trilha do pedido confirmado, do lote liberado e da impressora que saiu de disponível. Esperado: estado anterior, estado novo, usuário e momento.
2. Como `vendas@farm3d.local`, abrir a mesma trilha. Esperado: recusa.
3. As saídas de produção e Waste da seção 5 aparecem com gramas, custo por origem, lote de material e execução. Numa baixa que usa vários lotes de material, a soma dos detalhes de uma execução é o consumo real.
4. Os eventos de cancelamento e os movimentos de liberação de reserva aparecem sem duplicação.

## Pronto quando

- `npm test` na raiz verde nos dois workspaces, incluindo o cenário 10 peças / 4 por prancha, a reserva recusada, parâmetros preservados, consumo, falha, reimpressão, cancelamento, rollback e concorrência, o 401 e o 403, e o guarda de rota da SPA. Nenhum teste pulado.
- `npm run typecheck` na raiz verde.
- As oito seções acima conferidas, ou só a seção 1 se a entrega parou no MVP.
