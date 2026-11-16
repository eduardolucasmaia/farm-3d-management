# Quickstart: Reimplementar o núcleo da farm

Prova executável das histórias de `spec.md`. Números de exemplo são fictícios.

## Pré-requisitos

- .NET 8 SDK
- Node.js 20 ou mais novo
- Docker, para o SQL Server

Na raiz do repositório:

```powershell
copy .env.example .env
# preencher MSSQL_SA_PASSWORD, Jwt__SigningKey e FARM3D_SEED_PASSWORD
docker compose up -d sql
dotnet test src/Farm3d.Tests/Farm3d.Tests.csproj
dotnet run --project src/Farm3d.Api
```

Noutro terminal:

```powershell
cd web
npm install
npm test
npm run dev
```

A API sobe em `http://localhost:5088`. A SPA em `http://localhost:5173`. Usuários semeados em Development: `admin@farm3d.local`, `vendas@farm3d.local`, `producao@farm3d.local`, `compras@farm3d.local`, `operador@farm3d.local`. A senha é a de `FARM3D_SEED_PASSWORD`.

Os testes automatizados MUST estar verdes antes das seções manuais. Cada seção vale sozinha se a semente da história estiver aplicada.

## 1. Pedido aprovado vira 3 lotes (US1)

Semente fictícia: modelo "Suporte demo (fictício)", 4 peças por prancha, 60 minutos e 40 g por prancha, dois lotes de material do mesmo insumo (o mais antigo com saldo), impressora "Mesa A" compatível e "Mesa B" incompatível.

1. Entrar como `vendas@farm3d.local` e confirmar um pedido de 10 peças desse modelo, cor e tamanho oferecidos, data prometida daqui a sete dias.
2. Entrar como `producao@farm3d.local` e liberar os lotes.
3. Esperado: 3 lotes, peças 4, 4 e 2. Minutos 60, 60 e 30. Gramas 40, 40 e 20. Os três na fila. A reserva começa pelo lote de material mais antigo.
4. Enfileirar o primeiro lote na "Mesa B". Esperado: recusa, lote continua sem essa máquina.
5. Repetir a liberação. Esperado: recusa, reserva não dobra.
6. Zerar o saldo livre num segundo pedido igual. Esperado: liberação recusada e nenhuma reserva parcial.

`dotnet test` cobre o corte 10/4, a recusa por saldo e a incompatibilidade sem abrir o navegador.

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
5. Aprovar um terceiro com validade no passado e esperar o processamento horário (ou o gancho de desenvolvimento que dispara uma passagem). Esperado: expirado, sem pedido.
6. Criar pedido manual. Esperado: confirmação pendente. Liberar lote, faturar ou pagar. Esperado: as três recusas. Confirmar o pedido. Esperado: confirmado. Cancelar um outro e tentar mudar o estado. Esperado: recusa.

## 4. Compra e recebimento (US4)

1. Como `compras@farm3d.local`, criar pedido de 1 kg de filamento e receber 400 g com código de lote. Esperado: lote de material com 400 g, pedido parcialmente recebido, custo por grama = preço do quilo / 1000.
2. Receber 0 g. Esperado: recusa.
3. Receber os 600 g restantes. Esperado: pedido recebido.
4. Material com ponto de reposição acima do livre, depois de uma passagem periódica. Esperado: sugestão com o saldo livre e a diferença até o ponto.

## 5. Dois estados (US5)

1. Como `operador@farm3d.local`, iniciar o primeiro lote da seção 1 na "Mesa A". Esperado: lote em impressão e máquina em impressão.
2. Pausar e retomar. Esperado: o lote pausa e volta; a máquina permanece em impressão.
3. Concluir informando as gramas reais. Esperado: lote aguardando retirada, máquina aguardando retirada, uma saída de estoque. Concluir de novo. Esperado: recusa.
4. Confirmar a retirada. Esperado: lote concluído, máquina em preparação, sem aceitar outro lote.
5. Concluir a preparação com horas abaixo do limite. Esperado: máquina disponível.
6. Repetir uma impressão que leve as horas acumuladas ao limite. No fim da preparação, esperado: em manutenção, e um início novo é recusado. Confirmar a manutenção com uma nota. Esperado: horas zeradas e máquina disponível.
7. Falhar uma execução sem reimpressão. Esperado: lote em falha, reserva restante devolvida, máquina aguardando retirada.
8. Falhar outra com reimpressão. Esperado: lote de volta à fila, reserva mantida, execução nova ligada à anterior.

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

## 8. Trilha (US8)

1. Como admin, abrir a trilha do pedido confirmado, do lote liberado e da impressora que saiu de disponível. Esperado: estado anterior, estado novo, usuário e momento.
2. Como `vendas@farm3d.local`, abrir a mesma trilha. Esperado: recusa.
3. A saída de estoque da seção 5 aparece como movimentação com gramas, custo unitário e a execução de origem.

## Pronto quando

- `dotnet test` verde, incluindo o cenário 10 peças / 4 por prancha e a reserva recusada.
- `npm test` em `web/` verde no guarda de rota.
- As oito seções acima conferidas, ou só a seção 1 se a entrega parou no MVP.
