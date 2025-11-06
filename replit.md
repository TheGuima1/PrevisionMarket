# MatrizPIX - Plataforma Brasileira de Prediction Markets

## Visão Geral
MatrizPIX é uma plataforma de mercado de previsões (prediction market) inspirada na Polymarket, desenvolvida especificamente para o mercado brasileiro com suporte a Pix e crypto.

## Status do Projeto
**Fase Atual**: Integração & Polish ✅ | Testing 🔄
- ✅ Todos os schemas de dados definidos
- ✅ Design system configurado com cores vibrantes brasileiras
- ✅ Todos os componentes React implementados
- ✅ Backend completo com autenticação e API validada
- ✅ Banco de dados PostgreSQL com seed data
- ✅ Integração frontend-backend completa e funcionando
- ✅ Sistema de trading (compra YES/NO) testado e validado
- 🔄 AI Assistant integration pendente
- ⏳ Sistema de venda pendente
- ⏳ Testes end-to-end completos pendentes

## Arquitetura

### Stack Tecnológico
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (GPT-5)
- **Autenticação**: Passport.js com sessions

### Estrutura de Dados
- **Users**: Autenticação, saldo BRL/USDC, admin flags
- **Markets**: Mercados binários (YES/NO) por categoria
- **Positions**: Posições dos usuários em mercados
- **Orders**: Histórico de trades
- **Comments**: Sistema de discussão por mercado
- **Transactions**: Histórico de carteira (Pix/USDC mockado)

## Features MVP

### ✅ Implementadas (Frontend)
1. **Autenticação**
   - Login/Registro com email e senha
   - Username único e imutável
   - Protected routes

2. **Dashboard de Mercados**
   - Grid categorizado (Política, Economia, Cultura, Esportes, Ciência)
   - Filtros por categoria
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

### ✅ Integração Completa
- TanStack Query configurado com cache invalidation
- Estados de loading/error implementados
- Fluxo completo de trading validado:
  * Login/Register funcionando
  * Listagem de markets (público) funcionando
  * Compra de YES/NO shares funcionando
  * Portfolio exibindo posições corretamente
  * Balances atualizando após trades

### 🔄 Em Andamento
- Sistema de venda de posições (sell orders)
- AI Assistant integration com context-awareness
- Sistema de discussão/comentários
- Wallet deposits/withdrawals mockados
- Admin panel para criar/resolver mercados

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

## Próximos Passos

### Tarefa 2: Backend Completo
1. Implementar autenticação (auth.ts)
2. Setup database com Drizzle
3. Criar todos os endpoints da API
4. Implementar lógica de matching de ordens
5. Sistema de resolução de mercados
6. Transações mockadas (Pix/USDC)

### Tarefa 3: Integração & Testing
1. Conectar frontend ao backend
2. Implementar AI assistant com OpenAI
3. Testes end-to-end
4. Polimento final

## Observações Importantes
- Pagamentos Pix e Crypto são MOCKADOS para MVP
- Resolução de mercados é MANUAL por admin (oráculo descentralizado para v2)
- AI Assistant usa Replit AI Integrations (sem API key própria)
- Design guidelines devem ser seguidos religiosamente

## User Journey Principal
1. Usuário se registra → escolhe username único
2. Deposita fundos (mockado) via Pix ou USDC
3. Navega por mercados categorizados
4. Visualiza detalhes e analisa odds em múltiplos formatos
5. Faz ordem de compra (SIM ou NÃO)
6. Participa de discussões por mercado
7. Monitora posições no portfólio
8. Recebe pagamento quando mercado é resolvido
9. Saca fundos (mockado)

## Contato com IA Assistant
O assistente IA pode:
- Explicar como a plataforma funciona
- Interpretar e converter odds entre formatos
- Analisar sentimento do mercado
- Recomendar mercados interessantes
- Responder dúvidas sobre trading
