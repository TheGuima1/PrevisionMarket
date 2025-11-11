# Palpites.AI - Explicação Completa do Sistema
## Manual Técnico-Didático em Linguagem Simples

---

## 1. RESUMO EM 1 MINUTO (NÃO TÉCNICO)

### O que o sistema faz

**Palpites.AI** é uma plataforma onde você aposta em eventos futuros (tipo "Lula vai ganhar em 2026?" ou "Bitcoin vai chegar a $100 mil?") usando dinheiro de verdade. É como uma "bolsa de valores de palpites".

### Para quem é

Para brasileiros que querem:
- Ganhar dinheiro acertando previsões sobre política, esportes, economia e tecnologia
- Especular em eventos futuros como se fossem ações
- Participar de um mercado onde o preço muda conforme a opinião coletiva

### Problema que resolve

Hoje, se você quer apostar em eventos (não-esportivos), precisa usar sites gringos (tipo Polymarket) que só aceitam criptomoedas complicadas. **Palpites.AI** resolve isso:
- ✅ Deposita com **PIX** (instantâneo, em reais)
- ✅ Interface 100% em português
- ✅ Preços justos calculados automaticamente (AMM)
- ✅ Conversa com assistente de IA para entender mercados

### Resultado para o usuário

- **Antes**: pagar em Bitcoin, não entender odds, plataforma em inglês
- **Depois**: PIX → apostar → ganhar/perder → sacar em reais
- **Diferencial**: preços mudam em tempo real conforme demanda (tipo ações)

---

## 2. MAPA DAS FUNÇÕES PRINCIPAIS

### 2.1 Criar Conta e Escolher Username

**O que o usuário faz:**
- Acessa o site, clica em "Entrar"
- Digita email e senha
- Depois do primeiro login, escolhe um username único (tipo @joao123)

**O que o sistema faz:**
- Salva email e senha encriptada no banco de dados PostgreSQL
- Cria uma "carteira" virtual com R$ 0,00 de saldo
- Força a escolha de username antes de permitir apostas (modal que não fecha)
- Usa sessões seguras (cookies) para manter você logado

**Arquivos envolvidos:**
- `client/src/pages/auth-page.tsx` → Tela de login/cadastro
- `client/src/components/username-setup-modal.tsx` → Modal que pede username
- `server/auth.ts` → Lógica de login usando Passport.js
- `server/routes.ts` → Rota POST `/api/auth/register` (criar conta)
- `shared/schema.ts` → Tabela `users` no banco de dados

---

### 2.2 Depositar Dinheiro (PIX Mockado)

**O que o usuário faz:**
- Clica em "Depositar PIX" no menu
- Digita o valor em reais (ex: R$ 100)
- "Confirma" o PIX (versão mock, não gera QR Code real ainda)

**O que o sistema faz:**
- Adiciona o valor na sua carteira (`balanceBrl`)
- Registra a transação na tabela `transactions` (tipo: `deposit_pix`)
- Atualiza o saldo exibido no canto superior direito

**Arquivos envolvidos:**
- `client/src/pages/deposit-page.tsx` → Tela de depósito
- `server/routes.ts` → Rota POST `/api/wallet/deposit`
- `server/storage.ts` → Função `updateUserBalance()` e `createTransaction()`

**Nota:** O PIX é **simulado** no MVP. Na versão real, integraria com provedor de pagamentos (Mercado Pago, PagSeguro, etc.).

---

### 2.3 Ver Mercados Disponíveis (Homepage Pública)

**O que o usuário faz:**
- Entra no site (mesmo sem login)
- Vê 5 abas: **Trending** | Política | Crypto | Tech | Sports
- Clica numa aba para filtrar mercados por categoria
- Clica num card de mercado para ver detalhes

**O que o sistema faz:**
- Busca todos os mercados ativos no banco (tabela `markets`)
- Calcula o preço SIM/NÃO a partir das "reservas" do AMM (explicação abaixo)
- Mostra os 4 mercados com maior volume na aba "Trending"
- Filtra por categoria nas outras abas

**Arquivos envolvidos:**
- `client/src/pages/home-page.tsx` → Página inicial com tabs
- `client/src/components/market-card.tsx` → Card de cada mercado
- `server/routes.ts` → Rota GET `/api/markets` (buscar mercados)
- `shared/utils/odds.ts` → Função `getYesPriceFromReserves()` (calcular preço)

---

### 2.4 Fazer Aposta (Trading com AMM)

**O que o usuário faz:**
- Entra num mercado (ex: "Lula 2026?")
- Escolhe **SIM** ou **NÃO**
- Digita o valor em reais (ex: R$ 100)
- Vê estimativa de shares (quotas) que vai receber
- Clica em "Palpitar" (confirmar)

**O que o sistema faz (COMPLEXO, MAS IMPORTANTE):**

1. **Valida saldo**: Verifica se você tem R$ 100 na carteira
2. **Aplica taxa de 2%**: 
   - Você paga R$ 100,00
   - O AMM recebe R$ 98,00 (2% fica como taxa da plataforma)
3. **Calcula shares usando fórmula AMM**:
   - O sistema usa **CPMM** (Constant Product Market Maker)
   - Fórmula: `(x + depósito) * (y - shares) = k` (constante)
   - Exemplo: Se há 50 BRL3 de reserva SIM e 50 de NÃO (k=2500):
     - Você deposita R$ 98 → vai para reserva NÃO (vira 148)
     - Reserva SIM diminui para 16,89 (2500 / 148)
     - Você recebe **33,11 shares SIM** (50 - 16,89)
4. **Atualiza banco**:
   - Desconta R$ 100 da sua carteira
   - Cria registro na tabela `orders` (tipo: yes/no, shares: 33.11, status: filled)
   - Atualiza reservas do mercado (`yesReserve`, `noReserve`, `k`)
   - Cria/atualiza sua posição na tabela `positions`
5. **Preço muda**: Agora o preço SIM subiu de 50% para 89,8% (menos SIM disponível)

**Arquivos envolvidos:**
- `client/src/components/trade-panel.tsx` → Painel de aposta na lateral
- `server/routes.ts` → Rota POST `/api/orders` (executar aposta)
- `server/amm-engine.ts` → Função `buyShares()` (lógica AMM)
- `server/storage.ts` → Funções `createOrder()`, `upsertPosition()`, `updateMarketReserves()`

**Por que isso importa:**
O preço **não é fixo**. Quanto mais gente aposta em SIM, mais caro fica SIM (e mais barato fica NÃO). É oferta e demanda automática!

---

### 2.5 Ver Portfólio (Minhas Posições)

**O que o usuário faz:**
- Clica em "Portfólio" no menu
- Vê 3 métricas principais:
  - **Valor Total**: quanto suas posições valem agora
  - **Investido**: quanto você gastou
  - **P&L** (Profit & Loss): lucro ou prejuízo
- Vê lista de mercados onde tem posições ativas

**O que o sistema faz:**
- Busca todas as suas posições (`positions` table)
- Para cada posição:
  - Pega o preço atual do mercado (das reservas)
  - Calcula: `valor atual = (shares SIM × preço SIM) + (shares NÃO × preço NÃO)`
  - Calcula P&L: `valor atual - total investido`
- Soma tudo para mostrar métricas agregadas

**Arquivos envolvidos:**
- `client/src/pages/portfolio-page.tsx` → Tela de portfólio
- `server/routes.ts` → Rota GET `/api/positions` (buscar posições do usuário)
- `server/storage.ts` → Função `getUserPositions()`

---

### 2.6 Conversar com Assistente de IA (Cachorro)

**O que o usuário faz:**
- Clica no ícone de cachorro no canto inferior direito
- Digita pergunta (ex: "Como funcionam as odds?")
- Vê resposta em linguagem simples
- Pode clicar em ações rápidas: "Explicar Odds", "Recomendar Mercados"

**O que o sistema faz:**
- Envia sua pergunta + histórico da conversa para OpenAI GPT-4
- GPT-4 responde com contexto da plataforma (treinado para ser didático)
- Retorna resposta em português brasileiro

**Arquivos envolvidos:**
- `client/src/components/ai-assistant.tsx` → Widget de chat flutuante
- `server/routes.ts` → Rota POST `/api/ai/chat` (enviar mensagem)
- OpenAI SDK → Integração via Replit AI (variável de ambiente `AI_INTEGRATIONS_OPENAI_API_KEY`)

---

### 2.7 Comentar em Mercados (Discussões)

**O que o usuário faz:**
- Entra num mercado
- Rola para a seção "Discussões"
- Escreve um comentário (tipo Reddit)
- Vê comentários de outros usuários

**O que o sistema faz:**
- Salva comentário na tabela `comments` (vinculado ao marketId e userId)
- Mostra upvotes/downvotes (números, sem funcionalidade de votar ainda)
- Ordena por mais recentes ou mais votados

**Arquivos envolvidos:**
- `client/src/pages/market-detail-page.tsx` → Seção de comentários
- `server/routes.ts` → Rota POST `/api/markets/:id/comments` (criar comentário)

---

### 2.8 Saque (Mock)

**O que o usuário faz:**
- Clica em "Sacar" no Portfólio
- Digita valor em reais
- Confirma (mock, sem PIX real)

**O que o sistema faz:**
- Reduz saldo `balanceBrl`
- Cria transação tipo `withdrawal_pix`

**Arquivos envolvidos:**
- `client/src/pages/portfolio-page.tsx` → Tab "Carteira"
- `server/routes.ts` → Rota POST `/api/wallet/withdraw`

---

### 2.9 Admin: Criar Mercados (Painel Admin)

**O que o admin faz:**
- Acessa `/admin` (só admins veem)
- Preenche formulário:
  - Título do mercado
  - Descrição
  - Categoria (Política, Crypto, etc.)
  - Data de encerramento
  - **Liquidez inicial** (mínimo R$ 100)
- Clica em "Criar Mercado"

**O que o sistema faz:**
- Cria mercado na tabela `markets`
- **Seeds liquidez**: Deposita R$ 100 dividido em:
  - 50 BRL3 na reserva SIM
  - 50 BRL3 na reserva NÃO
  - k = 50 × 50 = 2500 (constante do AMM)
- Agora o mercado está pronto para receber apostas

**Arquivos envolvidos:**
- `client/src/pages/admin-page.tsx` → Painel administrativo
- `server/routes.ts` → Rota POST `/api/admin/markets` (criar mercado)
- `server/amm-engine.ts` → Função `seedMarket()` (criar reservas iniciais)

**Por que liquidez inicial?**
Sem isso, o preço seria indefinido (divisão por zero). O admin "empresta" R$ 100 para o mercado começar.

---

### 2.10 Admin: Resolver Mercados

**O que o admin faz:**
- No painel admin, vê lista de mercados encerrados
- Clica em "Resolver"
- Escolhe resultado: **SIM** | **NÃO** | **CANCELADO**
- Confirma

**O que o sistema faz:**
- Marca mercado como `resolved` na coluna `status`
- Salva resultado em `resolvedOutcome`
- Paga usuários vencedores:
  - Se resolveu SIM: quem tem shares SIM recebe R$ 1,00 por share
  - Se resolveu NÃO: quem tem shares NÃO recebe R$ 1,00 por share
  - Se cancelado: todos recebem dinheiro de volta

**Arquivos envolvidos:**
- `client/src/pages/admin-page.tsx` → Botão "Resolver Mercado"
- `server/routes.ts` → Rota POST `/api/admin/markets/:id/resolve`
- `server/storage.ts` → Função `resolveMarket()` (pagar vencedores)

---

## 3. COMO O CÓDIGO VIRA EXPERIÊNCIA (UX)

### JORNADA A: Novo Usuário Cria Conta e Faz Primeiro Depósito

#### Diagrama em Texto (ASCII)
```
[Usuário abre site]
    ↓
[Homepage pública] → Front: home-page.tsx
    ↓ clica "Entrar"
[Tela de Login/Cadastro] → Front: auth-page.tsx
    ↓ preenche email + senha + clica "Criar conta"
[API POST /api/auth/register] → Back: routes.ts + auth.ts
    ↓ salva no banco
[Banco: tabela users] → DB: PostgreSQL (Neon)
    ↓ retorna sucesso + cria sessão
[Redireciona para homepage] → Front: App.tsx (router)
    ↓ detecta "sem username"
[Modal de Username] → Front: username-setup-modal.tsx
    ↓ usuário digita "joao123"
[API POST /api/auth/set-username] → Back: routes.ts
    ↓ atualiza banco
[Banco: users.username = "joao123"]
    ↓ recarrega página
[Homepage logado com navbar] → Front: navbar.tsx (mostra saldo R$ 0,00)
    ↓ clica "Depositar PIX"
[Tela de Depósito] → Front: deposit-page.tsx
    ↓ digita R$ 100 + clica "Confirmar"
[API POST /api/wallet/deposit] → Back: routes.ts
    ↓ atualiza saldo
[Banco: users.balanceBrl = 100.00]
    ↓ retorna sucesso
[Toast "Depósito realizado!"] → Front: toast notification
    ↓ atualiza navbar
[Saldo exibido: R$ 100,00 BRL3] → Front: navbar.tsx
```

#### Passo a Passo Detalhado

**Passo 1: Usuário clica "Entrar"**
- **Ação**: Clique no botão "Entrar" na homepage
- **Reação visível**: Abre tela de login/cadastro com tabs "Entrar" e "Criar conta"
- **Código executa**: Componente `AuthPage` renderiza formulário
- **Arquivo**: `client/src/pages/auth-page.tsx` (linha 45-120)

**Passo 2: Preenche email e senha**
- **Ação**: Digite email (`joao@gmail.com`) e senha (`senha123`)
- **Reação visível**: Campos validam em tempo real (mínimo 6 caracteres na senha)
- **Código executa**: React Hook Form com validação Zod
- **Arquivo**: `client/src/pages/auth-page.tsx` usa schema `registerSchema` de `shared/schema.ts` (linha 198-201)

**Passo 3: Clica "Criar conta"**
- **Ação**: Botão submit no formulário
- **Reação visível**: Spinner de loading, depois redireciona
- **Código executa**:
  1. POST para `/api/auth/register` com `{email, password}`
  2. Backend usa `scrypt` para encriptar senha
  3. Insere na tabela `users`: `{id: uuid, email, password: hash, balanceBrl: 0.00}`
  4. Passport.js cria sessão e envia cookie
- **Arquivos**:
  - `client/src/pages/auth-page.tsx` → Mutation de registro
  - `server/auth.ts` → Função `setupAuth()` (linha 30-80)
  - `shared/schema.ts` → Tabela `users` (linha 53-62)

**Passo 4: Modal de Username aparece**
- **Ação**: Automático (detecta `user.username === null`)
- **Reação visível**: Modal que não pode ser fechado, pedindo username
- **Código executa**: `UsernameGuard` em `App.tsx` verifica se usuário tem username
- **Arquivo**: `client/src/App.tsx` (linha 19-40), `client/src/components/username-setup-modal.tsx`

**Passo 5: Escolhe username**
- **Ação**: Digita "joao123" e clica "Salvar"
- **Reação visível**: Modal fecha, página recarrega
- **Código executa**:
  1. POST para `/api/auth/set-username` com `{username: "joao123"}`
  2. Valida unicidade (SELECT COUNT WHERE username = ?)
  3. UPDATE users SET username = ? WHERE id = ?
- **Arquivo**: `server/routes.ts` (rota POST `/api/auth/set-username`)

**Passo 6: Clica "Depositar PIX"**
- **Ação**: No navbar, clica botão "Depositar PIX"
- **Reação visível**: Navega para `/wallet/deposit`
- **Código executa**: Router do Wouter muda rota
- **Arquivo**: `client/src/components/navbar.tsx`, `client/src/App.tsx` (linha 49)

**Passo 7: Preenche valor e confirma**
- **Ação**: Digita R$ 100,00 e clica "Confirmar Depósito"
- **Reação visível**: Spinner, depois toast verde "Depósito realizado!"
- **Código executa**:
  1. POST para `/api/wallet/deposit` com `{amount: "100", currency: "BRL3", type: "deposit_pix"}`
  2. Backend: `updateUserBalance(userId, currentBalance + 100)`
  3. Backend: `createTransaction({userId, type: deposit_pix, amount: 100})`
  4. Frontend: TanStack Query invalida cache `/api/user` (atualiza saldo)
- **Arquivos**:
  - `client/src/pages/deposit-page.tsx`
  - `server/routes.ts` (rota POST `/api/wallet/deposit`, linha 500-520)
  - `server/storage.ts` → `updateUserBalance()`, `createTransaction()`

**Passo 8: Saldo atualizado**
- **Ação**: Automático após sucesso
- **Reação visível**: No navbar, saldo muda de "R$ 0,00" para "R$ 100,00 BRL3"
- **Código executa**: TanStack Query refetch de `/api/user`, componente re-renderiza
- **Arquivo**: `client/src/components/navbar.tsx` (exibe `user.balanceBrl`)

---

### JORNADA B: Usuário Faz Sua Primeira Aposta

#### Diagrama em Texto
```
[Homepage logado]
    ↓ clica card "Lula 2026"
[Página de Detalhes do Mercado] → Front: market-detail-page.tsx
    ↓ carrega dados
[API GET /api/markets/:id] → Back: routes.ts
    ↓ retorna market data
[Exibe: título, odds, reservas AMM, painel de trade] → Front: trade-panel.tsx
    ↓ usuário clica tab "SIM"
[Tab SIM ativa] → Front: trade-panel.tsx (state: orderType = "yes")
    ↓ digita R$ 100 no input
[Calcula estimativa de shares] → Front: cálculo local (stakeBRL / probability)
    ↓ mostra "~33.11 shares SIM" (estimativa)
[Usuário clica "Palpitar"]
    ↓
[API POST /api/orders] → Back: routes.ts (linha 141-230)
    ↓ valida saldo (100 ≤ balanceBrl?)
    ↓ busca market reserves (yesReserve, noReserve, k)
    ↓ chama AMM engine
[AMM: buyShares(100, "yes", reserves)] → Back: amm-engine.ts
    ↓ aplica spread 2% (98 BRL3 ao AMM, 2 BRL3 fee)
    ↓ executa CPMM: newNoReserve = 50+98=148, newYesReserve = 2500/148=16.89
    ↓ sharesBought = 50-16.89 = 33.11
    ↓ retorna {sharesBought: 33.11, newYesReserve: 16.89, newNoReserve: 148}
[Atualiza Banco]
    ↓ UPDATE users SET balanceBrl = 0.00 WHERE id = userId
    ↓ INSERT INTO orders (..., shares: 33.11, totalCost: 100, status: filled)
    ↓ UPDATE markets SET yesReserve=16.89, noReserve=148, totalVolume+=100
    ↓ UPSERT positions (yesShares += 33.11, totalInvested += 100)
[Retorna sucesso] → Back responde HTTP 200
    ↓
[Toast "Aposta realizada!"] → Front: toast verde
    ↓ invalida cache
[TanStack Query refetch] → Front: queryClient.invalidateQueries
    ↓ re-busca markets, positions, user
[UI atualiza]
    ↓ Saldo: R$ 0,00 (gastou os R$ 100)
    ↓ Odds SIM: 89.8% (subiu de 50%)
    ↓ Portfólio: nova posição com 33.11 shares SIM
```

#### Passo a Passo Detalhado

**Passo 1: Usuário clica no card "Lula 2026"**
- **Ação**: Na homepage, clica num market card
- **Reação visível**: Navega para página de detalhes (`/market/:id`)
- **Código executa**: Router muda para `MarketDetailPage`
- **Arquivo**: `client/src/components/market-card.tsx` (Link to /market/${id})

**Passo 2: Página carrega dados do mercado**
- **Ação**: Automático
- **Reação visível**: Exibe título, descrição, odds atuais, painel de trade
- **Código executa**:
  - GET `/api/markets/:id`
  - Retorna: `{title, yesReserve: 50, noReserve: 50, k: 2500, totalVolume, ...}`
  - Frontend calcula preço: `yesPrice = noReserve / (yes + no) = 50/100 = 0.50 (50%)`
- **Arquivos**:
  - `client/src/pages/market-detail-page.tsx` → useQuery
  - `server/routes.ts` → GET `/api/markets/:id` (linha 114-125)
  - `shared/utils/odds.ts` → `getYesPriceFromReserves()`

**Passo 3: Escolhe "SIM" no painel**
- **Ação**: Clica na tab "SIM" (verde)
- **Reação visível**: Tab fica destacada, odds SIM aparecem grande
- **Código executa**: `setOrderType("yes")` (React state)
- **Arquivo**: `client/src/components/trade-panel.tsx` (linha 22, 89-107)

**Passo 4: Digita R$ 100 no campo**
- **Ação**: Foco no input "Valor da aposta (BRL3)", digita "100"
- **Reação visível**: 
  - Embaixo aparece: "Investimento: R$ 100,00"
  - "Retorno total (se ganhar): R$ 101,12" (aproximado)
  - "Lucro líquido: R$ 1,12"
- **Código executa** (no navegador):
  ```js
  const probability = 0.50 (50%)
  const stakeBRL = 100
  const estimatedShares = 100 / 0.50 = 200 shares (estimativa ERRADA - ignora AMM)
  const estimatedPayout = stakeBRL / probability = 200 (se ganhar, vale R$ 200)
  ```
  **NOTA**: A estimativa é **simplificada**. O cálculo real do AMM dá 33.11 shares.
- **Arquivo**: `client/src/components/trade-panel.tsx` (linha 31-38)

**Passo 5: Clica "Palpitar"**
- **Ação**: Botão "Palpitar" na parte de baixo
- **Reação visível**: Botão vira spinner "Processando..."
- **Código executa**:
  - Frontend: `buyMutation.mutate()`
  - POST para `/api/orders` com `{marketId, type: "yes", usdcAmount: 100}`
- **Arquivo**: `client/src/components/trade-panel.tsx` (linha 40-78)

**Passo 6: Backend valida e executa AMM**
- **Ação**: Servidor recebe requisição
- **Reação visível**: Nenhuma ainda (processando)
- **Código executa** (CRÍTICO):
  
  ```js
  // 1. Valida saldo
  const user = await storage.getUser(userId);
  if (user.balanceBrl < 100) return 400 "Saldo insuficiente"
  
  // 2. Busca estado do mercado
  const market = await storage.getMarket(marketId);
  const ammState = {
    yesReserve: 50.00,
    noReserve: 50.00,
    k: 2500.0000
  }
  
  // 3. Aplica spread de 2%
  const usdcAmount = 100.00
  const effectiveUsdcIn = 100 * 0.98 = 98.00 // AMM recebe 98
  const spreadFee = 2.00 // Taxa da plataforma
  
  // 4. Executa CPMM
  function executeTradeWithCPMM(98, "yes", 50, 50, 2500):
    // Comprar YES: deposita USDC na reserva NO, retira shares YES
    newNoReserve = 50 + 98 = 148.00
    newYesReserve = k / newNoReserve = 2500 / 148 = 16.89
    sharesBought = yesReserve - newYesReserve = 50 - 16.89 = 33.11
    avgPrice = 98 / 33.11 = 2.96 BRL3/share (preço pro AMM)
    // Mas usuário pagou 100, então avgPrice real = 100/33.11 = 3.02
    
    return {
      sharesBought: 33.11,
      avgPrice: 2.96,
      newYesReserve: 16.89,
      newNoReserve: 148.00,
      newK: 2500.0000,
      spreadFee: 2.00
    }
  
  // 5. Atualiza banco de dados (transação SQL)
  BEGIN TRANSACTION
    UPDATE users 
      SET balanceBrl = 0.00 
      WHERE id = userId
    
    INSERT INTO orders (
      userId, marketId, type: "yes", action: "buy",
      shares: 33.11, price: 2.96, totalCost: 100.00,
      status: "filled", feePaid: 2.00, takerFeeBps: 200
    )
    
    UPDATE markets 
      SET yesReserve = 16.89, 
          noReserve = 148.00,
          k = 2500.0000,
          totalVolume = totalVolume + 100.00
      WHERE id = marketId
    
    // Upsert position (cria ou atualiza)
    INSERT INTO positions (userId, marketId, yesShares, totalInvested)
      VALUES (userId, marketId, 33.11, 100.00)
      ON CONFLICT (userId, marketId) 
      DO UPDATE SET 
        yesShares = yesShares + 33.11,
        totalInvested = totalInvested + 100.00
  COMMIT
  
  return HTTP 200 { order: {...} }
  ```

- **Arquivos**:
  - `server/routes.ts` → POST `/api/orders` (linha 141-230)
  - `server/amm-engine.ts` → `buyShares()`, `executeTradeWithCPMM()` (linha 62-168)
  - `server/storage.ts` → `createOrder()`, `updateMarketReserves()`, `upsertPosition()`, `updateUserBalance()`

**Passo 7: Frontend recebe sucesso**
- **Ação**: Servidor responde HTTP 200
- **Reação visível**:
  - Toast verde aparece: "Aposta realizada! Você apostou R$ 100,00 BRL3 em SIM"
  - Campo de input limpa (volta para R$ 0,00)
- **Código executa**: 
  - `buyMutation.onSuccess()` → mostra toast
  - `queryClient.invalidateQueries(["/api/markets", marketId])`
  - `queryClient.invalidateQueries(["/api/positions"])`
  - `queryClient.invalidateQueries(["/api/user"])`
- **Arquivo**: `client/src/components/trade-panel.tsx` (linha 49-66)

**Passo 8: UI atualiza automaticamente**
- **Ação**: TanStack Query refaz requisições
- **Reação visível**:
  - **Saldo no navbar**: R$ 100,00 → R$ 0,00 ✓
  - **Odds SIM**: 50% → 89.8% ✓ (preço subiu!)
  - **Volume total**: +R$ 100,00
  - **Portfólio** (se clicar): Nova posição "Lula 2026" com 33.11 shares SIM
- **Código executa**: React re-renderiza componentes com novos dados
- **Arquivos**: Todos os componentes que usam os dados invalidados

---

### JORNADA C: Usuário Saca Dinheiro

#### Diagrama em Texto
```
[Usuário no Portfólio]
    ↓ clica tab "Carteira"
[Tab Carteira] → Front: portfolio-page.tsx
    ↓ seção "Saque PIX"
    ↓ digita R$ 50
[Clica "Sacar"]
    ↓
[API POST /api/wallet/withdraw] → Back: routes.ts
    ↓ valida saldo ≥ 50
    ↓ UPDATE users SET balanceBrl = balanceBrl - 50
    ↓ INSERT INTO transactions (type: withdrawal_pix, amount: -50)
[Retorna sucesso]
    ↓
[Toast "Saque realizado!"] → Front
[Saldo atualizado na UI]
```

#### Passo a Passo Detalhado

**Passo 1: Clica tab "Carteira"**
- **Ação**: No portfólio, clica tab "Carteira" (entre Posições e Histórico)
- **Reação visível**: Mostra saldo disponível e formulários de depósito/saque
- **Código executa**: Tabs do Shadcn/UI trocam conteúdo
- **Arquivo**: `client/src/pages/portfolio-page.tsx` (linha 127-250)

**Passo 2: Preenche valor de saque**
- **Ação**: No campo "Valor", digita "50"
- **Reação visível**: Input aceita números
- **Código executa**: `setWithdrawAmount("50")` (React state)

**Passo 3: Clica "Sacar"**
- **Ação**: Botão "Sacar"
- **Reação visível**: Spinner, depois toast
- **Código executa**:
  ```js
  POST /api/wallet/withdraw
  Body: {amount: "50", currency: "BRL3", type: "withdrawal_pix"}
  
  // Backend
  const user = await storage.getUser(userId);
  if (parseFloat(user.balanceBrl) < 50) return 400 "Saldo insuficiente"
  
  await storage.updateUserBalance(userId, currentBalance - 50);
  await storage.createTransaction({
    userId,
    type: "withdrawal_pix",
    amount: -50.00,
    currency: "BRL3"
  });
  
  return 200 {success: true}
  ```
- **Arquivos**:
  - `client/src/pages/portfolio-page.tsx` → `withdrawMutation`
  - `server/routes.ts` → POST `/api/wallet/withdraw` (linha 540-565)

**Passo 4: Saldo atualizado**
- **Ação**: Automático
- **Reação visível**: Saldo no navbar diminui R$ 50
- **Código executa**: Cache invalidado, UI re-renderiza

**NOTA**: No MVP, o saque é **mockado**. Não gera chave PIX nem transfere dinheiro real. Em produção, integraria com gateway de pagamentos.

---

## 4. DADOS: ONDE GUARDAMOS E COMO CIRCULAM

### Armazenamento (Banco de Dados PostgreSQL)

O sistema usa **PostgreSQL** hospedado no **Neon** (cloud).  
**Por que PostgreSQL?** É confiável para dinheiro (suporta transações ACID).

#### Tabelas Principais

| Tabela | O que guarda | Exemplo |
|--------|--------------|---------|
| **users** | Contas de usuário | email, senha (hash), saldo BRL3, isAdmin |
| **markets** | Mercados de previsão | título, categoria, reservas AMM (yesReserve, noReserve, k), volume |
| **positions** | Posições ativas dos usuários | userId + marketId, shares SIM/NÃO, total investido |
| **orders** | Histórico de apostas | userId, marketId, tipo (yes/no), shares, preço, status (filled) |
| **comments** | Comentários nos mercados | marketId, userId, texto, upvotes |
| **transactions** | Histórico da carteira | userId, tipo (deposit_pix, withdrawal_pix), valor |

#### Visualização das Relações
```
┌─────────┐
│  users  │
└────┬────┘
     │ (1 user → N positions)
     ▼
┌────────────┐      ┌──────────┐
│ positions  │◄─────┤ markets  │
└────────────┘      └──────────┘
     │                    │
     │                    │ (1 market → N orders)
     ▼                    ▼
┌────────────┐      ┌──────────┐
│   orders   │      │ comments │
└────────────┘      └──────────┘
```

---

### Fluxo de Dados (Ciclo de Vida)

#### Exemplo: Depósito de R$ 100

1. **Nasce**: Usuário digita "100" no formulário
2. **Viaja**: Frontend → Backend (POST /api/wallet/deposit, body: {amount: 100})
3. **Valida**: Backend verifica se valor > 0
4. **Persiste**: 
   - `UPDATE users SET balanceBrl = balanceBrl + 100 WHERE id = ?`
   - `INSERT INTO transactions (..., type: deposit_pix, amount: 100)`
5. **Retorna**: Backend responde HTTP 200
6. **Atualiza UI**: Frontend refaz GET /api/user, navbar mostra novo saldo

#### Exemplo: Aposta de R$ 100 em SIM

1. **Nasce**: Usuário clica "Palpitar" com R$ 100
2. **Viaja**: Frontend → Backend (POST /api/orders)
3. **Valida**: Verifica saldo, mercado ativo, liquidez suficiente
4. **Calcula AMM**: Executa fórmula CPMM (33.11 shares)
5. **Persiste** (transação SQL):
   - `UPDATE users SET balanceBrl = balanceBrl - 100`
   - `INSERT INTO orders (...)`
   - `UPDATE markets SET yesReserve=..., noReserve=...`
   - `INSERT INTO positions (...) ON CONFLICT UPDATE`
6. **Retorna**: Dados da ordem criada
7. **Atualiza UI**: Invalida caches, re-renderiza

---

### Estado no Navegador (Client-Side)

| Dado | Onde fica | Quanto tempo fica |
|------|-----------|-------------------|
| **Sessão de login** | Cookie HTTP-only (`connect.sid`) | 7 dias ou até logout |
| **Dados do usuário** | TanStack Query cache (`/api/user`) | Até invalidar (após depósito/aposta) |
| **Lista de mercados** | TanStack Query cache (`/api/markets`) | Refetch a cada 5s (polling) |
| **Conversa com IA** | useState local (não persiste) | Até fechar aba do chat |
| **Tema claro/escuro** | localStorage (`theme`) | Permanente (até limpar) |

**Como funciona o cache?**
- TanStack Query guarda respostas de API na memória RAM
- Quando você faz aposta, chama `invalidateQueries()` → força nova busca
- Isso atualiza saldo/posições automaticamente (sem recarregar página)

---

### Segurança Básica

#### Logins e Senhas
- **Senha nunca guardada em texto puro**. Usamos `scrypt` (criptografia):
  ```js
  const hash = await scrypt("senha123", salt, 64);
  // Banco guarda: "a3f5b2c8..." (impossível reverter para "senha123")
  ```
- **Login**: Compara hash da senha digitada com hash salvo
- **Arquivo**: `server/auth.ts` (linha 40-75)

#### Sessões (Manter Logado)
- Quando loga, servidor cria uma **sessão** (ID aleatório longo)
- Guarda em cookie: `connect.sid=abc123xyz789`
- A cada requisição, cookie é enviado → servidor sabe quem você é
- **Duração**: 7 dias (configurável em `server/auth.ts`)

#### Proteção de Rotas
- **Middleware `requireAuth`**: Bloqueia acesso se não logado
- **Middleware `requireAdmin`**: Bloqueia acesso se não for admin
- **Exemplo**: GET /api/positions → só usuário logado pode ver suas posições
- **Arquivo**: `server/routes.ts` (linha 21-44)

#### Dados Sensíveis
- **Variáveis de ambiente** (.env):
  - `DATABASE_URL`: Conexão com banco (senha do PostgreSQL)
  - `SESSION_SECRET`: Chave para encriptar cookies
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: Chave da OpenAI
- **NUNCA** expostas no frontend (servidor não envia)

---

### Tabela de Dados Detalhada

| Dado | Onde nasce | Onde fica salvo | Quem pode ver | Por quanto tempo |
|------|------------|-----------------|---------------|------------------|
| Email/senha | Formulário de registro | Tabela `users` (senha = hash) | Só o próprio usuário | Permanente (até deletar conta) |
| Saldo BRL3 | Depósito PIX | `users.balanceBrl` (decimal) | Só o dono e admins | Atualiza a cada transação |
| Shares de mercados | Após aposta | `positions.yesShares`/`noShares` | Só o dono | Até resolver mercado |
| Reservas AMM | Admin cria mercado | `markets.yesReserve`/`noReserve` | Público (qualquer um) | Atualiza a cada trade |
| Comentários | Usuário posta | `comments.content` | Público | Permanente |
| Mensagens de IA | Chat no frontend | Não persiste (só RAM) | Só quem está conversando | Até fechar chat |
| Cookie de sessão | Login bem-sucedido | Navegador (cookie HTTP-only) | Servidor lê, JS não acessa | 7 dias ou logout |

---

## 5. ARQUITETURA EM 1 PÁGINA (SEM JARGÃO)

```
┌──────────────────────────────────────────────────┐
│               USUÁRIO (Navegador)                │
│  - Chrome, Firefox, Safari, etc.                 │
│  - Vê páginas HTML + CSS bonito                  │
│  - Clica botões, preenche formulários            │
└───────────────────┬──────────────────────────────┘
                    │ HTTP (internet)
                    │
┌───────────────────▼──────────────────────────────┐
│           FRONT-END (React + TypeScript)         │
│  Pasta: client/src/                              │
│  ┌────────────────────────────────────────┐      │
│  │ PÁGINAS (o que você vê)                │      │
│  │ - home-page.tsx (lista de mercados)    │      │
│  │ - market-detail-page.tsx (apostar)     │      │
│  │ - portfolio-page.tsx (minhas apostas)  │      │
│  │ - auth-page.tsx (login/cadastro)       │      │
│  │ - admin-page.tsx (criar mercados)      │      │
│  └────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────┐      │
│  │ COMPONENTES (peças reutilizáveis)      │      │
│  │ - market-card.tsx (card de mercado)    │      │
│  │ - trade-panel.tsx (painel de aposta)   │      │
│  │ - navbar.tsx (barra de navegação)      │      │
│  │ - ai-assistant.tsx (chat do cachorro)  │      │
│  └────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────┐      │
│  │ GERENCIADOR DE DADOS                   │      │
│  │ - TanStack Query (cache de APIs)       │      │
│  │ - React State (formulários temporários)│      │
│  └────────────────────────────────────────┘      │
└───────────────────┬──────────────────────────────┘
                    │ Chama APIs (POST/GET)
                    │ Exemplo: GET /api/markets
                    │
┌───────────────────▼──────────────────────────────┐
│          BACK-END (Node.js + Express)            │
│  Pasta: server/                                  │
│  ┌────────────────────────────────────────┐      │
│  │ ROTAS (endpoints da API)               │      │
│  │ - routes.ts (todas as rotas)           │      │
│  │   ├─ GET /api/markets (listar)         │      │
│  │   ├─ POST /api/orders (apostar)        │      │
│  │   ├─ POST /api/wallet/deposit (PIX)    │      │
│  │   └─ POST /api/ai/chat (IA)            │      │
│  └────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────┐      │
│  │ LÓGICA DE NEGÓCIO                      │      │
│  │ - amm-engine.ts (fórmula de preços)    │      │
│  │ - auth.ts (login/logout)               │      │
│  │ - storage.ts (funções do banco)        │      │
│  └────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────┐      │
│  │ MIDDLEWARE (checagens)                 │      │
│  │ - requireAuth() (precisa login?)       │      │
│  │ - requireAdmin() (é admin?)            │      │
│  │ - Passport.js (gerencia sessões)       │      │
│  └────────────────────────────────────────┘      │
└───────────────────┬──────────────────────────────┘
                    │ SQL queries
                    │ INSERT, UPDATE, SELECT
                    │
┌───────────────────▼──────────────────────────────┐
│      BANCO DE DADOS (PostgreSQL no Neon)         │
│  ┌────────────────────────────────────────┐      │
│  │ TABELAS                                │      │
│  │ - users (email, senha, saldo)          │      │
│  │ - markets (título, reservas AMM)       │      │
│  │ - orders (apostas executadas)          │      │
│  │ - positions (shares que você tem)      │      │
│  │ - comments (discussões)                │      │
│  │ - transactions (histórico da carteira) │      │
│  └────────────────────────────────────────┘      │
│  🔒 Armazena TUDO com segurança                  │
└──────────────────────────────────────────────────┘
           ▲                        ▲
           │                        │
           │ (futuro)               │ (MVP mockado)
           │                        │
┌──────────┴────────┐   ┌──────────┴──────────┐
│ SERVIÇOS EXTERNOS │   │  PIX (Mercado Pago) │
│  - OpenAI (GPT-4) │   │  Hoje: simulado     │
│    Assistente IA  │   │  Futuro: real       │
└───────────────────┘   └─────────────────────┘
```

### Como Tudo Se Conecta

1. **Usuário clica** → Front-end captura
2. **Front-end chama** → Back-end via HTTP
3. **Back-end processa** → Valida, calcula AMM, etc.
4. **Back-end acessa** → Banco de dados (salva/busca)
5. **Banco responde** → Back-end
6. **Back-end responde** → Front-end (JSON)
7. **Front-end atualiza** → Tela do usuário (React re-renderiza)

---

## 6. ARQUIVO-POR-ARQUIVO (TOUR GUIADO)

### 📁 RAIZ DO PROJETO

| Arquivo | Para que serve |
|---------|----------------|
| `package.json` | Lista de bibliotecas instaladas (React, Express, OpenAI, etc.) |
| `replit.md` | Documentação do projeto (arquitetura, decisões) |
| `design_guidelines.md` | Regras de design (cores, tipografia, componentes) |
| `tsconfig.json` | Configuração do TypeScript (como escrever código) |
| `vite.config.ts` | Configuração do Vite (ferramenta que junta o código) |
| `drizzle.config.ts` | Configuração do Drizzle ORM (conversa com banco) |

---

### 📁 `client/` (FRONT-END)

#### `client/src/pages/` (TELAS)

| Arquivo | O que faz |
|---------|-----------|
| `home-page.tsx` | Homepage pública com 5 tabs (Trending, Política, etc.) e lista de mercados |
| `market-detail-page.tsx` | Página de detalhes de um mercado (odds, descrição, painel de trade, comentários) |
| `portfolio-page.tsx` | Portfólio do usuário (posições, saldo, histórico, depósito/saque) |
| `auth-page.tsx` | Tela de login e cadastro (tabs "Entrar" e "Criar conta") |
| `admin-page.tsx` | Painel administrativo (criar mercados, resolver mercados, ver estatísticas) |
| `deposit-page.tsx` | Tela de depósito PIX (mock - futuramente mostrará QR Code) |
| `not-found.tsx` | Página 404 (quando URL não existe) |

#### `client/src/components/` (COMPONENTES REUTILIZÁVEIS)

| Arquivo | O que faz |
|---------|-----------|
| `market-card.tsx` | Card de mercado (título, odds, volume) - usado na homepage |
| `trade-panel.tsx` | Painel lateral de aposta (escolher SIM/NÃO, digitar valor, confirmar) |
| `navbar.tsx` | Barra de navegação logada (Mercados, Portfólio, saldo, logout) |
| `public-navbar.tsx` | Barra de navegação pública (Entrar, Criar conta) |
| `ai-assistant.tsx` | Chat flutuante com assistente de IA (cachorro no canto) |
| `username-setup-modal.tsx` | Modal que pede username após primeiro login |
| `odds-display.tsx` | Exibe odds em 3 formatos (Decimal, US, Probabilidade) |
| `how-it-works.tsx` | Modal explicativo "Como Funciona" |
| `order-book.tsx` | Lista de ordens abertas (futuro - CLOB) |

#### `client/src/components/ui/` (COMPONENTES BASE - Shadcn/UI)

Componentes prontos de interface (botões, cards, inputs, modais, etc.).  
Não precisa mexer - já estão prontos.

#### `client/src/hooks/` (LÓGICA REUTILIZÁVEL)

| Arquivo | O que faz |
|---------|-----------|
| `use-auth.tsx` | Hook que gerencia login/logout/estado do usuário |
| `use-toast.ts` | Hook para mostrar notificações (toasts verdes/vermelhos) |

#### `client/src/lib/` (UTILIDADES)

| Arquivo | O que faz |
|---------|-----------|
| `queryClient.ts` | Configuração do TanStack Query (cache de dados) + função `apiRequest()` |
| `utils.ts` | Funções auxiliares (ex: `cn()` para juntar classes CSS) |
| `protected-route.tsx` | Componente que bloqueia rotas se não logado |

#### `client/src/App.tsx`

Arquivo principal que configura:
- Router (rotas da aplicação)
- Providers (TanStack Query, Auth, Tooltips)
- UsernameGuard (força username antes de usar app)

#### `client/src/main.tsx`

Ponto de entrada do front-end (monta o React no HTML).

#### `client/src/index.css`

Estilos globais (cores, fontes, Tailwind CSS).

---

### 📁 `server/` (BACK-END)

| Arquivo | O que faz |
|---------|-----------|
| `index.ts` | Inicia servidor Express (porta 5000), conecta banco, registra rotas |
| `routes.ts` | **TODAS as rotas da API** (markets, orders, wallet, admin, AI chat) - ARQUIVO GIGANTE |
| `auth.ts` | Lógica de autenticação (login, logout, cadastro, sessões com Passport.js) |
| `amm-engine.ts` | **Motor AMM** - funções de cálculo de preços, execução de trades com CPMM |
| `storage.ts` | Interface com banco de dados (funções como `getMarkets()`, `createOrder()`, etc.) |
| `db.ts` | Conexão com PostgreSQL via Drizzle ORM |
| `seed.ts` | Script para popular banco com dados iniciais (admin, 6 mercados) |
| `vite.ts` | Integração do Vite (serve front-end em desenvolvimento) |

---

### 📁 `shared/` (CÓDIGO COMPARTILHADO)

| Arquivo | O que faz |
|---------|-----------|
| `schema.ts` | **SUPER IMPORTANTE** - Define estrutura do banco (tabelas, colunas, tipos) + validações Zod |
| `utils/odds.ts` | Funções para calcular/converter odds (decimal, US, probabilidade, payouts) |
| `utils/currency.ts` | Funções para formatar dinheiro (ex: `formatBRL3("100.50")` → "100,50 BRL3") |

---

## 7. PONTOS DE UX QUE AFETAM O CÓDIGO

### 7.1 Preços Atualizando em Tempo Real

**UX Desejada:** Usuário vê odds mudando conforme outras pessoas apostam.

**Implementação Atual:**
- TanStack Query faz polling a cada 5 segundos (refetch automático)
- Arquivo: `client/src/pages/home-page.tsx` (linha 20-26)
  ```js
  useQuery({
    queryKey: ["/api/markets"],
    staleTime: 0, // Considera dados "velhos" imediatamente
    refetchInterval: 5000, // Busca a cada 5s
  })
  ```

**Problema:** Se 100 usuários abrirem a página, são 100 requisições a cada 5s = sobrecarga no servidor.

**Solução Futura:** WebSocket (servidor envia atualizações, não cliente pedindo).

---

### 7.2 Estimativa de Shares (Imprecisa)

**UX Atual:** Você digita R$ 100, o sistema mostra "~200 shares" (estimativa simplificada).

**Problema:** O cálculo real do AMM dá **33.11 shares** (muito diferente!).

**Por que acontece:**
- Frontend usa fórmula simples: `shares = valor / preço` (ignora AMM)
- AMM real é não-linear (preço muda conforme você compra)

**Onde está:**
- `client/src/components/trade-panel.tsx` (linha 33-35)

**Solução Futura:** Chamar API `/api/orders/preview` (simula trade sem executar, retorna shares reais).

---

### 7.3 Modal de Username Não Pode Fechar

**UX Desejada:** Forçar usuário a escolher username único antes de usar a plataforma.

**Implementação:**
- Modal sem botão "X"
- Só fecha depois de sucesso
- Arquivo: `client/src/components/username-setup-modal.tsx`

**Por que:** Evita usuários sem username (crítico para exibir rankings e comentários).

---

### 7.4 Feedback de Loading

**UX Atual:** Skeleton loaders (retângulos cinzas pulsando) enquanto carrega mercados.

**Implementação:**
- `client/src/pages/home-page.tsx` (linha 46-52)
- Usa componente `<Skeleton>` do Shadcn/UI

**Por que:** Melhor que tela em branco (usuário sabe que está carregando).

---

### 7.5 Validação de Formulários

**UX Desejada:** Mostrar erros antes de enviar (ex: "Senha deve ter 6+ caracteres").

**Implementação:**
- React Hook Form + Zod Resolver
- Valida em tempo real (on blur e on submit)
- Arquivo: `client/src/pages/auth-page.tsx` usa `registerSchema` do `shared/schema.ts`

**Por que:** Feedback imediato = menos frustração.

---

## 8. ERROS COMUNS E MENSAGENS HUMANAS

| Erro Provável | Causa | Mensagem Atual (Código) | Mensagem Ideal (Humana) | Onde Tratar |
|---------------|-------|-------------------------|-------------------------|-------------|
| **Saldo insuficiente** | Tentar apostar R$ 100 com R$ 50 | "Insufficient balance" | "Você não tem saldo suficiente. Deposite mais R$ 50 via PIX." | `server/routes.ts` POST /api/orders |
| **Email já existe** | Cadastrar com email repetido | "Email already exists" | "Este email já está cadastrado. Tente fazer login." | `server/auth.ts` register |
| **Username já existe** | Escolher username "joao123" já usado | "Username already taken" | "O username 'joao123' já foi escolhido. Tente outro!" | `server/routes.ts` POST /api/auth/set-username |
| **Mercado fechado** | Apostar em mercado já encerrado | "Market is not active" | "Este mercado já encerrou. Não é possível apostar." | `server/routes.ts` POST /api/orders |
| **Valor inválido** | Digitar "abc" no campo de valor | "Amount must be greater than 0" | "Digite um valor válido em reais (ex: 100.00)." | `client/src/components/trade-panel.tsx` |
| **Sessão expirada** | Ficar 7+ dias sem logar | "Unauthorized" | "Sua sessão expirou. Faça login novamente." | Middleware `requireAuth` |
| **Senha incorreta** | Senha errada no login | "Invalid credentials" | "Email ou senha incorretos. Tente novamente." | `server/auth.ts` login |
| **Mercado sem liquidez** | Admin tenta criar mercado com seed < R$ 100 | "Seed amount must be at least 100" | "Você precisa depositar no mínimo R$ 100 para criar o mercado." | `server/routes.ts` POST /api/admin/markets |
| **PIX expirado** (futuro) | QR Code expira após 15min | "Payment expired" | "O PIX expirou. Gere um novo QR Code." | (Não implementado ainda) |
| **Falha na API de IA** | OpenAI fora do ar | "AI service unavailable" | "O assistente está temporariamente indisponível. Tente novamente em alguns minutos." | `server/routes.ts` POST /api/ai/chat |

---

## 9. DESEMPENHO E ESTABILIDADE (VERSÃO LEIGA)

### 9.1 Onde Pode Ficar Lento

#### Problema: Muitas Requisições Simultâneas
- **Quando:** 100 usuários apostando ao mesmo tempo
- **Por que fica lento:** Banco de dados só processa 1 escrita por vez (lock)
- **Como melhorar:** 
  - Usar fila (tipo "senha de banco") - biblioteca `bull` + Redis
  - Processar apostas em ordem, não todas de uma vez

#### Problema: Cálculo AMM Complexo
- **Quando:** Mercados com milhares de trades
- **Por que fica lento:** Fórmula matemática roda a cada aposta
- **Como melhorar:**
  - Cachear preços (guardar atalho) por 1 segundo
  - Só recalcular quando alguém aposta de verdade

#### Problema: Homepage Com 100+ Mercados
- **Quando:** Plataforma crescer
- **Por que fica lento:** Buscar todos os mercados de uma vez
- **Como melhorar:**
  - Paginação (mostrar 20 por vez, botão "Ver mais")
  - Lazy loading (carregar conforme usuário rola a página)

---

### 9.2 Monitoramento

**O que existe hoje:**
- ✅ Logs no console do servidor (`console.log`, `console.error`)
- ✅ Health check endpoint (`GET /health`) - verifica se banco está conectado

**O que NÃO existe (mas deveria):**
- ❌ Alertas quando servidor cai (usar: Sentry, Rollbar)
- ❌ Métricas de performance (tempo de resposta, CPU, RAM)
- ❌ Logs estruturados (JSON parseable) para análise

**Recomendação Futura:**
- Integrar Sentry (captura erros automaticamente)
- Usar Datadog ou New Relic (monitorar performance)

---

### 9.3 O Que Testar Primeiro

#### Testes de "Caminho Feliz" (Tudo Funciona)
1. Criar conta → Escolher username → Depositar R$ 100 → Apostar R$ 50 → Ver portfólio
2. Fazer aposta de R$ 10 → Ver preço mudar → Fazer outra aposta → Confirmar P&L atualizado
3. Admin cria mercado → Seeda R$ 100 → Primeiro usuário aposta → Mercado fica ativo

#### Testes de Erro (O Que Pode Dar Errado)
1. Tentar apostar R$ 100 com R$ 0 → Ver mensagem de erro clara
2. Tentar criar mercado com seed R$ 50 → Bloquear (mínimo R$ 100)
3. Tentar logar com senha errada 5x → Ver mensagem "Tente novamente"
4. Perder conexão com internet no meio de aposta → Mostrar "Erro de rede"

**Ferramenta Recomendada:**
- Playwright (testa no navegador, igual usuário real) ✅ Já configurado no Replit

---

## 10. INTEGRAÇÕES EXTERNAS

### 10.1 OpenAI (GPT-4) - Assistente de IA

**O que é:** Serviço de inteligência artificial que responde perguntas.

**O que trocam:**
- **Palpites.AI envia:** Pergunta do usuário + histórico de conversa
- **OpenAI responde:** Texto explicativo em PT-BR

**Onde aparece no código:**
- `server/routes.ts` → POST `/api/ai/chat` (linha 600-650)
- Usa biblioteca `openai` (npm package)
- Chave de API: variável `AI_INTEGRATIONS_OPENAI_API_KEY` (fornecida pelo Replit)

**Custo:** ~$0.002 por pergunta (GPT-4 Turbo)

---

### 10.2 PIX (Futuro - Mercado Pago ou PagSeguro)

**O que é:** Sistema de pagamento instantâneo brasileiro.

**O que trocará (quando implementar):**
- **Palpites.AI envia:** Valor a cobrar (ex: R$ 100)
- **Gateway de PIX responde:** QR Code + chave PIX + ID da transação
- **Webhook:** Gateway avisa quando PIX foi pago

**Onde implementar:**
- `server/routes.ts` → POST `/api/wallet/deposit`
  - Chamar API do Mercado Pago: `POST /v1/payments`
  - Salvar `pixQrCode` e `pixQrCodeBase64` no banco (tabela `pending_deposits`)
  - Criar rota `/webhook/pix` para receber confirmação

**Bibliotecas:**
- `mercadopago` (SDK oficial) ou
- `asaas` (alternativa brasileira)

---

### 10.3 Neon (PostgreSQL Hosting)

**O que é:** Hospedagem do banco de dados na nuvem.

**O que trocam:**
- **Palpites.AI envia:** SQL queries (INSERT, UPDATE, SELECT)
- **Neon responde:** Dados ou confirmação

**Conexão:** Variável `DATABASE_URL` (string de conexão)

**Custo:** Gratuito até 10 GB + 1M queries/mês

---

### 10.4 Replit (Plataforma de Deploy)

**O que é:** Onde o código roda (servidor + domínio .replit.app).

**Integrações automáticas:**
- Secrets Manager (variáveis de ambiente seguras)
- Auto-deploy ao fazer git push
- AI Integrations (OpenAI sem configurar API key)

---

## 11. GUIA DE EXECUÇÃO LOCAL E DEPLOY

### 11.1 Rodar Localmente (Do Zero)

#### Pré-requisitos
- Node.js 20+ instalado
- Conta no Replit (ou Git + terminal local)

#### Passo 1: Clonar Projeto
```bash
git clone <URL_DO_REPO>
cd palpites-ai
```

#### Passo 2: Instalar Dependências
```bash
npm install
```

#### Passo 3: Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz:
```
DATABASE_URL=postgresql://user:password@localhost:5432/palpitesai
SESSION_SECRET=chave-super-secreta-aleatoria
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
```

**Obter DATABASE_URL:**
- Se usar Neon: copiar da dashboard do Neon
- Se usar PostgreSQL local: `postgresql://postgres:senha@localhost:5432/palpitesai`

**Obter OpenAI API Key:**
- Ir em https://platform.openai.com/api-keys
- Criar chave, copiar (começa com `sk-`)

#### Passo 4: Criar Banco de Dados

Se PostgreSQL local:
```bash
psql -U postgres
CREATE DATABASE palpitesai;
\q
```

Sincronizar tabelas:
```bash
npm run db:push
```

#### Passo 5: Popular Banco (Seed)
```bash
tsx server/seed.ts
```

Isso cria:
- Admin (email: `admin@matrizpix.com`, senha: `admin123`)
- Demo (email: `demo@matrizpix.com`, senha: `demo123`)
- 6 mercados com liquidez R$ 100 cada

#### Passo 6: Iniciar Servidor
```bash
npm run dev
```

Acessar: http://localhost:5000

---

### 11.2 Deploy para Produção (Replit)

#### Passo 1: Conectar Repositório
- No Replit, clicar "Import from GitHub"
- Conectar repo

#### Passo 2: Configurar Secrets
No painel "Secrets" do Replit, adicionar:
- `DATABASE_URL` (do Neon)
- `SESSION_SECRET` (gerar no terminal: `openssl rand -hex 32`)
- `AI_INTEGRATIONS_OPENAI_API_KEY` (já vem automático no Replit)

#### Passo 3: Deploy
- Clicar em "Run" no Replit
- Servidor inicia automaticamente
- URL pública: `https://<nome-do-repl>.<seu-username>.replit.app`

#### Passo 4: Seed Automático
O código já tem auto-seed embutido. Na primeira vez que rodar, vai popular o banco sozinho.

---

### 11.3 Checklist "Pronto para Produção"

- [ ] Variáveis de ambiente configuradas (DATABASE_URL, SESSION_SECRET)
- [ ] Banco de dados criado e populado (seed rodou)
- [ ] Testar login/cadastro
- [ ] Testar depósito mockado (adiciona saldo)
- [ ] Testar aposta (desconta saldo, cria posição)
- [ ] Testar portfólio (mostra P&L correto)
- [ ] Testar assistente de IA (responde perguntas)
- [ ] Admin consegue criar mercados
- [ ] Admin consegue resolver mercados
- [ ] Logs de erro funcionando (Sentry configurado - futuro)
- [ ] Health check respondendo: `GET /health` retorna 200 OK
- [ ] SSL ativado (HTTPS) - no Replit é automático
- [ ] Domínio personalizado configurado (opcional)

---

## 12. GLOSSÁRIO LEIGO (A→Z)

| Termo | Explicação Simples (1 frase) |
|-------|------------------------------|
| **AMM** | Sistema que calcula preços automaticamente sem precisar de compradores e vendedores diretos (tipo "robô de bolsa"). |
| **API** | Porta de comunicação entre front-end e back-end (exemplo: POST /api/orders = "fazer aposta"). |
| **Auth** | Abreviação de autenticação = processo de login/cadastro/verificar quem você é. |
| **Backend** | Parte do sistema que roda no servidor (lida com banco de dados, cálculos, segurança). |
| **BRL3** | Nome fictício da moeda da plataforma (equivale a R$ 1,00 = 1 BRL3). |
| **Cache** | Guardar um "atalho" de dados na memória para não buscar no banco toda vez (mais rápido). |
| **CLOB** | Central Limit Order Book = livro de ordens (tipo Mercado Livre, mas para apostas) - **não implementado no MVP**. |
| **Cookie** | Arquivo pequeno que o navegador guarda para lembrar que você está logado. |
| **CPMM** | Constant Product Market Maker = fórmula matemática (x × y = k) que calcula preços no AMM. |
| **Endpoint** | Um endereço específico da API (exemplo: `/api/markets` = buscar mercados). |
| **Frontend** | Parte do sistema que roda no navegador (HTML, CSS, React = o que você vê). |
| **Hash** | Transformar senha em código embaralhado (impossível reverter) - segurança. |
| **HTTP** | Protocolo de comunicação na internet (GET = buscar, POST = enviar). |
| **k (constante)** | No AMM, o valor que sempre se mantém (x × y = k) para garantir liquidez. |
| **Liquidez** | Quantidade de dinheiro "parado" num mercado para permitir trocas. |
| **Middleware** | Função que roda ANTES de processar uma rota (exemplo: checar se está logado). |
| **Mock** | Versão simulada/falsa de algo (PIX mockado = não gera QR Code real, só finge). |
| **Odds** | Número que indica quanto você ganha se acertar (1.50 = ganha R$ 1,50 para cada R$ 1,00). |
| **Polling** | Ficar perguntando "tem novidade?" a cada X segundos (tipo refresh automático). |
| **P&L** | Profit & Loss = lucro ou prejuízo (quanto você ganhou ou perdeu). |
| **PostgreSQL** | Tipo de banco de dados (guarda tabelas com linhas e colunas, tipo Excel). |
| **Query** | Pergunta ao banco de dados (SELECT = buscar, INSERT = adicionar). |
| **React** | Biblioteca JavaScript para criar interfaces (componentes = peças de LEGO). |
| **Reserva** | Quantidade de BRL3 "guardada" num mercado para permitir apostas (yesReserve, noReserve). |
| **Schema** | Estrutura do banco (quais tabelas existem, quais colunas cada uma tem). |
| **Seed** | Popular banco com dados iniciais (tipo "preparar a mesa antes do jantar"). |
| **Session** | Sessão = período que você fica logado (cookie guarda ID da sessão). |
| **Shares** | Quotas/pedaços de um mercado que você compra (tipo "ações de Lula 2026"). |
| **Spread** | Taxa cobrada pela plataforma (2% = você paga R$ 100, AMM recebe R$ 98). |
| **SQL** | Linguagem para falar com banco de dados (SELECT, INSERT, UPDATE, DELETE). |
| **State** | Estado = dados que mudam na tela (exemplo: valor digitado no input). |
| **Toast** | Notificação pequena que aparece no canto (verde = sucesso, vermelho = erro). |
| **Token** | Código aleatório longo que identifica você (usado para API ou sessões). |
| **TypeScript** | JavaScript com "regras de tipo" (evita bugs, obriga declarar se é número ou texto). |
| **Webhook** | Servidor externo te avisa quando algo acontece (tipo "PIX foi pago, olha aí!"). |
| **Zod** | Biblioteca que valida dados (exemplo: "email precisa ter @"). |

---

## 13. PRIORIDADES (PRÓXIMOS PASSOS EM 7 DIAS)

### Top 8 Ações Ordenadas por Impacto na UX

#### 1. **Melhorar Estimativa de Shares no Painel de Trade** ⭐⭐⭐⭐⭐
**Problema:** Usuário vê "~200 shares" mas recebe 33.11 (confunde).  
**Solução:** Criar endpoint `/api/orders/preview` que simula trade e retorna shares reais.  
**Impacto:** Elimina surpresas negativas, aumenta confiança.  
**Arquivos:** `server/routes.ts` (nova rota), `client/src/components/trade-panel.tsx` (chamar preview).

---

#### 2. **Adicionar Loading State Claro no Botão de Aposta** ⭐⭐⭐⭐⭐
**Problema:** Ao clicar "Palpitar", botão fica parado (usuário não sabe se funcionou).  
**Solução:** Mudar texto para "Processando..." + spinner.  
**Impacto:** Feedback imediato = menos cliques duplicados.  
**Arquivos:** `client/src/components/trade-panel.tsx` (linha 68-78, adicionar `disabled={buyMutation.isPending}`).

---

#### 3. **Salvar Rascunho de Aposta (LocalStorage)** ⭐⭐⭐⭐
**Problema:** Se usuário recarrega página, perde valor digitado.  
**Solução:** Salvar `amountBRL` no localStorage, restaurar ao voltar.  
**Impacto:** Menos frustração, especialmente em mobile (troca de app).  
**Arquivos:** `client/src/components/trade-panel.tsx` (useEffect para salvar/restaurar).

---

#### 4. **Integrar PIX Real (QR Code)** ⭐⭐⭐⭐
**Problema:** Depósito é mockado, não funciona de verdade.  
**Solução:** Integrar API do Mercado Pago ou Asaas.  
**Impacto:** Usuários podem depositar dinheiro real = MVP funcional.  
**Arquivos:** `server/routes.ts` POST `/api/wallet/deposit` (chamar API externa), criar rota `/webhook/pix`.

---

#### 5. **Adicionar Confirmação Visual Após Aposta** ⭐⭐⭐⭐
**Problema:** Toast some rápido, usuário não vê quanto ganhou de shares.  
**Solução:** Modal de confirmação: "✅ Você recebeu 33.11 shares SIM por R$ 100,00. Ver Portfólio →".  
**Impacto:** Reforça sucesso, incentiva ver portfólio.  
**Arquivos:** `client/src/components/trade-panel.tsx` (usar Dialog do Shadcn/UI).

---

#### 6. **Melhorar Mensagens de Erro (Todas as Rotas)** ⭐⭐⭐
**Problema:** Erros em inglês ("Insufficient balance") confundem usuários brasileiros.  
**Solução:** Traduzir TODOS os erros do backend para PT-BR.  
**Impacto:** Menos confusão, mais profissional.  
**Arquivos:** `server/routes.ts` (trocar strings de erro), `server/auth.ts`.

---

#### 7. **Adicionar Tutorial de Primeiro Uso (Onboarding)** ⭐⭐⭐
**Problema:** Novos usuários não sabem por onde começar.  
**Solução:** Após escolher username, mostrar tour guiado (tooltips): "1️⃣ Deposite via PIX → 2️⃣ Escolha um mercado → 3️⃣ Faça sua aposta".  
**Impacto:** Reduz abandono de novos usuários.  
**Arquivos:** Criar componente `onboarding-tour.tsx` (usar biblioteca `react-joyride`).

---

#### 8. **Mostrar Histórico de Preços (Gráfico)** ⭐⭐⭐
**Problema:** Usuário não vê como preço mudou ao longo do tempo.  
**Solução:** Salvar `priceHistory` na tabela markets (snapshot a cada hora), exibir gráfico no market detail.  
**Impacto:** Ajuda a tomar decisões (ver tendências).  
**Arquivos:** Nova tabela `price_snapshots`, usar biblioteca `recharts` no frontend.

---

**BONUS: Quick Wins (< 1 hora cada)**
- ✅ Adicionar favicon personalizado (`client/public/favicon.png`)
- ✅ Trocar placeholder "Mensagem a ser escrita" na homepage
- ✅ Adicionar meta tags de SEO (`<title>`, `<description>`)
- ✅ Melhorar contraste de cores no modo escuro (legibilidade)

---

## CONCLUSÃO

Este documento explica **TODO** o sistema Palpites.AI em linguagem simples:
- ✅ O que faz e para quem é
- ✅ Todas as funcionalidades principais
- ✅ Como código vira experiência (3 jornadas completas)
- ✅ Onde os dados são guardados e como circulam
- ✅ Arquitetura em texto (sem diagramas complexos)
- ✅ Tour arquivo-por-arquivo
- ✅ Pontos críticos de UX e código
- ✅ Mensagens de erro humanizadas
- ✅ Performance e monitoramento
- ✅ Integrações externas
- ✅ Guia de execução e deploy
- ✅ Glossário de A a Z
- ✅ Próximos passos priorizados

**Para qualquer dúvida**, consulte:
1. Este documento (ctrl+F para buscar)
2. Assistente de IA no sistema (cachorro no canto)
3. Comentários no código (menos frequentes, mas existem)

**Última atualização:** 09 de Novembro de 2025  
**Versão:** MVP 1.0 (AMM + Spread 2% + Seed Liquidity)
