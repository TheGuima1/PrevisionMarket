# MatrizPIX - Plataforma Brasileira de Prediction Markets

## Visão Geral
MatrizPIX é uma plataforma de mercado de previsões (prediction market) inspirada na Polymarket, desenvolvida especificamente para o mercado brasileiro com suporte a Pix e crypto.

## Status do Projeto
**Fase Atual**: FASE 1 Completa ✅ | MVP Completo + Decimal Odds + PT-BR

### Tarefas Recentes Concluídas (07 Nov 2025)
- ✅ **MVP/POC SIMPLIFICATION** (07 Nov 2025) - COMPLETO
  - ✅ **TradePanel Simplificado**: Removidas limit orders para foco MVP
    - Apenas market orders (SIM/NÃO tabs)
    - Interface simplificada: valor em BRL → cálculo automático de shares
    - Sem complexidade de CLOB (orderbook, limit price, buy/sell toggle)
    - Mantidas: Decimal odds display, payout preview, PT-BR labels
  - ✅ **Seed Data com Volume Realista**: 
    - Criados trades seed para todos os 8 mercados
    - Volume entre R$ 127,50 e R$ 984,00 (não mais R$ 0)
    - Mercados aparecem "ativos" desde o primeiro acesso
  - ✅ **Matemática de Odds Verificada**:
    - YES order: shares = stakeBRL / yesPrice, odds = 1 / yesPrice
    - NO order: shares = stakeBRL / noPrice, odds = 1 / noPrice
    - Payout correto: shares × R$ 1,00 (se ganhar)
    - Exemplo: R$ 100 em YES (45%) → 222 shares × 2.22x = R$ 222 payout
  - ✅ **E2E Test Passed**: TradePanel simplificado, odds decimais corretas, BRL formatting, volumes realistas
  - ✅ **Production-ready**: MVP focado em simplicidade sem sacrificar UX

- ✅ **FASE 1: Decimal Odds + PT-BR Localization** (07 Nov 2025) - COMPLETO
  - ✅ **Utilities criados**: 
    - `shared/utils/odds.ts`: probToOdds(), oddsToProb(), formatOdds() para conversão/formatação
    - `shared/utils/currency.ts`: formatBRL(), formatBRLCompact(), formatDateTimeBR()
  - ✅ **Decimal odds como PRIMARY display**:
    - MarketCard: Odds decimais em destaque com tooltip de probabilidade
    - TradePanel: Odds decimais para Market Orders (limit orders removidas no MVP)
    - Portfolio: BRL formatting em todos valores monetários
  - ✅ **100% PT-BR Localization**:
    - Categorias: "Em Alta", "Urgente", "Novos", "Eleições", "Política", etc.
    - HomePage: "Aposte no Futuro", "Filtrar por tag", "Nenhum mercado encontrado"
    - TradePanel: "Apostar", "Investimento", "Retorno total", "Lucro líquido"
    - Toasts: "Aposta realizada!", "Erro ao executar ordem"
  - ✅ **E2E Test Passed**: Decimal odds display, BRL formatting, PT-BR labels
  - ✅ **Architect Review**: PASS - Production-ready, all deliverables met
  
### Tarefas Concluídas Anteriormente (06 Nov 2025)
- ✅ **Public Market Access Fix** (06 Nov 2025) - COMPLETO
  - ✅ Corrigido redirect forçado para /auth ao clicar em markets
  - ✅ Rota /market/:id agora é pública (não requer autenticação)
  - ✅ Usuários podem ver detalhes completos dos mercados sem login
  - ✅ Ações de trading permanecem protegidas (botões desabilitados sem auth)
  - ✅ E2E test passed: Homepage → Market Detail navigation sem auth
  - ✅ Architect review: PASS - Security OK, proper separation of public/protected routes
  - ✅ Production-ready: Browse completo de mercados sem necessidade de conta

- ✅ **Public Odds Display Integration** (06 Nov 2025) - COMPLETO
  - ✅ Market prices (yesPrice/noPrice) now update after every CLOB trade execution
  - ✅ Last traded price reflects on public landing page without authentication
  - ✅ Complementary pricing logic: yesPrice = fillPrice, noPrice = 1 - fillPrice (ou vice-versa)
  - ✅ E2E test passed: Trade at 0.75 shows 75.0%/25.0% on public homepage
  - ✅ Architect review: PASS - Performance OK, no security concerns
  - ✅ Production-ready: Public users see real-time market odds

- ✅ **Task 5**: Landing Page Pública Polymarket-Style (COMPLETO)
  - ✅ Homepage pública (sem auth required)
  - ✅ PublicNavbar com Login/Sign Up buttons
  - ✅ 14 category pills (All Markets + 13 Polymarket categories)
  - ✅ Tag-based filtering system
  - ✅ Category + Tag combined filters
  - ✅ E2E test passed: Public browse → Register → Username setup → Trading

- ✅ **Task 4**: Reestruturação Polymarket Categories
  - Schema atualizado com 13 categorias (trending, breaking, new, politics, sports, finance, crypto, geopolitics, tech, culture, world, economy, elections)
  - Sistema de tags implementado (text[] array)
  - Seed data migrado para novas categorias
  - Database reseeded com sucesso

- ✅ **CLOB (Central Limit Order Book) Implementation** (06 Nov 2025) - COMPLETO
  - ✅ **Schema**: orders table com action (buy/sell), type (yes/no), price (decimal 0-1), shares, filledShares, status (open/partially_filled/filled/cancelled)
  - ✅ **Matching Engine**: Auto-matching com price-time priority, partial fills, supports partially_filled orders
  - ✅ **Backend Routes**: POST /api/clob/orders (create+match), GET /api/clob/orderbook/:id (aggregated depth), GET /api/clob/my-orders (user open orders), DELETE /api/clob/orders/:id (cancel)
  - ✅ **Reserved Funds**: Balance validation considers open BUY orders to prevent over-commitment
  - ✅ **Frontend Components**: OrderBook (depth display), TradePanel (Market/Limit tabs), OpenOrders (cancel functionality)
  - ✅ **7 Critical Bugs Fixed**:
    1. OrderBook aggregation totalShares calculation
    2. getUserOpenOrders storage method created
    3. `or` imported from drizzle-orm for queries
    4. Matching engine uses `continue` not `break` for price compatibility
    5. getOpenOrders includes partially_filled status
    6. Reserved funds calculation from open BUY orders
    7. Button type="button" prevents form submission reload
  - ✅ **E2E Test Passed**: BUY/SELL limit orders, partial fills, full fills, order cancellation, positions updates, cache invalidation
  - ✅ **Architect Review**: PASS - Functional requirements met, balance protection working, verified end-to-end flows
  - ✅ **Fee Structure**: Maker 0-2 bps, Taker 5-10 bps (Polymarket-aligned)

### Backlog (Pós-MVP)
- ⏳ Real-time notifications (WebSockets)
- ⏳ Price history charts
- ⏳ Trader leaderboard
- ⏳ Decentralized oracle system
- ⏳ Real Pix/Crypto integration

## Arquitetura

### Stack Tecnológico
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (GPT-5)
- **Autenticação**: Passport.js com sessions

### Estrutura de Dados
- **Users**: Email+password auth, username (nullable, set post-login), saldo BRL/USDC, admin flags
- **Markets**: Mercados binários (YES/NO) com:
  - **Categories**: 13 categorias Polymarket-style (trending, breaking, new, politics, sports, finance, crypto, geopolitics, tech, culture, world, economy, elections)
  - **Tags**: text[] array para subcategorização (ex: ["Trump", "2024"], ["Gaza", "Israel"], ["Bitcoin", "ETF"])
- **Positions**: Posições dos usuários em mercados
- **Orders**: Histórico de trades
- **Comments**: Sistema de discussão por mercado
- **Transactions**: Histórico de carteira (Pix/USDC mockado)

## Features MVP

### ✅ Implementadas (Frontend)
1. **Autenticação**
   - Login/Registro com email + password (sem username required)
   - Username setup flow após primeiro login via modal
   - Username único e imutável
   - Protected routes com ensureUsername middleware

2. **Landing Page Pública Polymarket-Style**
   - ✅ Homepage pública sem autenticação
   - ✅ PublicNavbar com Login/Sign Up
   - ✅ 14 category pills (All + 13 Polymarket categories)
   - ✅ Tag-based filtering system
   - ✅ Category + Tag combined filters
   - ✅ Grid de markets com odds em tempo real
   - ✅ MarketCards com category badges coloridos

3. **Página de Detalhes do Mercado**
   - Informações completas do mercado
   - Exibição de odds em 3 formatos (Decimal, Americano, Probabilidade %)
   - Sistema de discussão estilo Reddit
   - Integração com painel de trading

4. **Painel de Trading**
   - Toggle YES/NO visual
   - Input de quantidade de ações
   - Cálculo automático de custo, ganho potencial e lucro
   - Exibição de odds nos 3 formatos

5. **Portfólio**
   - Visão geral: Valor Total, Investido, P&L
   - Lista de posições ativas com P&L por posição
   - Carteira mockada (Pix e USDC)
   - Histórico de transações

6. **Assistente IA (Cachorro)**
   - Chat flutuante com GPT-5
   - Quick actions: Explicar Odds, Como Funciona, Sentimento, Recomendar
   - Context-aware responses

7. **Painel Admin**
   - Criar novos mercados
   - Resolver mercados encerrados (SIM/NÃO/CANCELADO)
   - Visualizar todos os mercados

### ✅ Implementadas (Backend)
1. **Autenticação Completa**
   - Passport.js com LocalStrategy
   - Hash de senhas com scrypt
   - Sessions com PostgreSQL store
   - Protected routes middleware
   - Admin-only routes

2. **API Endpoints**
   - Mercados: listar (público), detalhes (público), criar (admin), resolver (admin)
   - Ordens: criar ordem de compra YES/NO (validação Zod completa)
   - Ordens: criar ordem de venda YES/NO (validação Zod completa)
   - Posições: listar portfolio do usuário
   - Comentários: listar e criar por mercado
   - Carteira: depósito/saque mockado (Pix e USDC)
   - Transações: histórico completo
   - AI Assistant: chat com GPT-5

3. **Lógica de Negócio**
   - Cálculo automático de preços (AMM-like)
   - Atualização de posições por usuário
   - Tracking de volume total
   - Validação de saldo antes de trade
   - Resolução manual de mercados (admin)

4. **Banco de Dados**
   - Schema aplicado com Drizzle
   - Seed data com 8 mercados demo
   - 2 usuários: admin/admin123, demo/demo123

### ✅ Integração Completa E2E Validada
- TanStack Query configurado com cache invalidation perfeita
- Estados de loading/error implementados em todas as páginas
- Fluxo completo de trading validado via Playwright:
  * ✅ Login/Register com validação de username único
  * ✅ Listagem de markets (público, sem auth required)
  * ✅ Compra de YES/NO shares com cálculo automático de preço
  * ✅ Venda de posições existentes (sell orders)
  * ✅ Portfolio exibindo posições + P&L em tempo real
  * ✅ Balances BRL/USDC atualizando após trades
  * ✅ Wallet deposits/withdrawals (Pix + USDC mockado)
  * ✅ Comments system (criar e listar por mercado)
  * ✅ AI Assistant com OpenAI GPT-5 (context-aware)
  * ✅ Admin Panel (criar mercados + resolver YES/NO/Cancelled)

## Design System

### Cores (Vibrantes Brasileiras)
- **Primary**: Verde-turquesa vibrante (160° 84% 39%)
- **Secondary**: Amarelo dourado (45° 93% 47%)
- **Accent**: Roxo vibrante (275° 80% 55%)
- **Charts**: Multicolorido para gráficos

### Tipografia
- **Sans**: Inter (dados, corpo)
- **Accent**: Outfit (títulos, AI assistant)
- **Mono**: Roboto Mono (valores numéricos)

### Componentes
Todos os componentes seguem rigorosamente o design_guidelines.md:
- Espaçamento consistente (2, 4, 6, 12)
- Shadcn UI components
- Elevation system (hover-elevate, active-elevate-2)
- Responsividade completa
- Estados de loading/error/empty visuais

## MVP Completo - Todas as Tarefas Concluídas ✅

### Credenciais Demo
- **Admin**: email=`admin@matrizpix.com`, password=`admin123` (username já configurado: `admin`)
- **Demo User**: email=`demo@matrizpix.com`, password=`demo123` (username já configurado: `demo`)

### Próximos Passos (Pós-MVP)
1. **Deploy/Publishing** - Usar Replit Deploy para produção
2. **Melhorias de UX**:
   - Notificações em tempo real (WebSockets)
   - Gráficos de histórico de preço
   - Leaderboard de traders
3. **Features Avançadas**:
   - Sistema de oráculo descentralizado
   - Integração real com Pix/Crypto
   - Sistema de referral/afiliados
   - Mercados multi-outcome (não apenas YES/NO)

## Observações Importantes
- Pagamentos Pix e Crypto são MOCKADOS para MVP
- Resolução de mercados é MANUAL por admin (oráculo descentralizado para v2)
- AI Assistant usa Replit AI Integrations (sem API key própria)
- Design guidelines devem ser seguidos religiosamente

## User Journey Principal (E2E Validado ✅)
1. ✅ Usuário navega markets publicamente (SEM login required)
2. ✅ Filtra por 14 categorias Polymarket (All + Trending, Elections, Sports, etc.)
3. ✅ Filtra por tags (Brazil, Lula, Bitcoin, etc.)
4. ✅ Decide se cadastrar → clica Login/Sign Up
5. ✅ Registro com email + password
6. ✅ Após primeiro login → define username único via modal
7. ✅ Deposita fundos (mockado) via Pix ou USDC
8. ✅ Navega por mercados categorizados
9. ✅ Visualiza detalhes e analisa odds em múltiplos formatos
10. ✅ Faz ordem de compra (SIM ou NÃO)
11. ✅ Participa de discussões por mercado
12. ✅ Monitora posições no portfólio
13. ✅ Recebe pagamento quando mercado é resolvido
14. ✅ Saca fundos (mockado)

## Contato com IA Assistant
O assistente IA pode:
- Explicar como a plataforma funciona
- Interpretar e converter odds entre formatos
- Analisar sentimento do mercado
- Recomendar mercados interessantes
- Responder dúvidas sobre trading
