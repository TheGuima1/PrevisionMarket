# MatrizPIX - Plataforma Brasileira de Prediction Markets

## Visão Geral
MatrizPIX é uma plataforma de mercado de previsões (prediction market) inspirada na Polymarket, desenvolvida especificamente para o mercado brasileiro com suporte a Pix e crypto.

## Status do Projeto
**Fase Atual**: Refatoração em Progresso 🚧 | Preparando Landing Page Pública

### Tarefas Recentes Concluídas
- ✅ **Task 4**: Reestruturação Polymarket Categories
  - Schema atualizado com 13 categorias (trending, breaking, new, politics, sports, finance, crypto, geopolitics, tech, culture, world, economy, elections)
  - Sistema de tags implementado (text[] array)
  - Seed data migrado para novas categorias
  - Database reseeded com sucesso

### Em Andamento
- 🚧 **Task 5**: Landing Page Pública (próximo)
  - Permitir browsing de markets sem autenticação
  - Navbar estilo Polymarket com categorias
  - Filtros por categoria e tags

### Backlog
- ⏳ Frontend updates para novas categorias
- ⏳ Public market browsing
- ⏳ Username uniqueness real-time validation

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

2. **Dashboard de Mercados**
   - Grid categorizado (PRECISA UPDATE para 13 categorias Polymarket)
   - Filtros por categoria (PRECISA UPDATE)
   - Cards com odds em tempo real
   - Quick actions (Comprar SIM/NÃO)

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

## User Journey Principal
1. Usuário navega markets publicamente (SEM login required) - 🚧 TODO
2. Decide se cadastrar → registro com email + password
3. Após primeiro login → define username único via modal
4. Deposita fundos (mockado) via Pix ou USDC
5. Navega por mercados categorizados (13 categorias Polymarket)
6. Filtra por categoria ou tags
7. Visualiza detalhes e analisa odds em múltiplos formatos
8. Faz ordem de compra (SIM ou NÃO)
9. Participa de discussões por mercado
10. Monitora posições no portfólio
11. Recebe pagamento quando mercado é resolvido
12. Saca fundos (mockado)

## Contato com IA Assistant
O assistente IA pode:
- Explicar como a plataforma funciona
- Interpretar e converter odds entre formatos
- Analisar sentimento do mercado
- Recomendar mercados interessantes
- Responder dúvidas sobre trading
