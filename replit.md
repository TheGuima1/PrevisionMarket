# Palpites.AI - Plataforma de Prediction Markets com BRL3

## Overview
Palpites.AI is a prediction market platform, inspired by Polymarket, designed for the Brazilian market. Users deposit via PIX, receive BRL3 tokens on-chain, and use them to trade on future events. The project aims to provide a robust, user-friendly, and localized platform for prediction markets, with ambitions for real-time features, advanced trading tools, and decentralized integration in future phases. The MVP is complete, featuring AMM-based pricing (CPMM with 2% spread), decimal odds, trade preview system, full PT-BR localization, and a production-ready deployment.

## Recent Changes (November 2025)
- **Mirror System with Auto-Validation (Nov 10)**: Enhanced mirror worker with boot-time slug validation. System auto-excludes invalid slugs (404/410) and logs consolidated warning, preventing log pollution. Keeps slugs with transient errors (network, rate limit) for retry. Added feature flag `ENABLE_POLYMARKET_CRON` (default: false) to disable legacy snapshot system. Mirror worker now validates slugs before starting, ensuring only valid markets are polled.
- **Mirror System with Freeze/Unfreeze (Nov 10)**: Implemented new mirror architecture for Polymarket integration. Guarantees YES/NO identification by **name** (case-insensitive), never by array position. Freeze logic: when odds spike ≥5% in 1 minute, display freezes at last stable value until 2 consecutive stable readings (<5% delta) OR 120s timeout. Dual-path stability check handles anchor reversion, new plateau formation, oscillation rejection, and gradual drift reseeding. New files: `server/mirror/adapter.ts`, `server/mirror/state.ts`, `server/mirror/worker.ts`. Spread (2%) now invisible to users - applied only at execution time via `AMM.buyShares(..., 200 bps)`. System displays pure Polymarket odds in UI.
- **Polymarket Multi-Outcome Support (Nov 10)**: Fixed critical bugs in Polymarket integration to support markets with 2+ outcomes (not just binary YES/NO). Rewrote `polymarket-client.ts` to use correct endpoint `/markets?slug={slug}` and parse `outcomes`/`outcomePrices` as JSON strings with escapes. Removed spread compression that broke probability normalization. System now correctly handles markets like Brazil election (14% Yes, 86% No) and multi-candidate races. Documentation updated with valid slugs and user guide for finding active markets.
- **Polymarket Integration (Hybrid Architecture)**: Added beta pilot integration with Polymarket API. Platform now displays 6 AMM markets + 3-5 Polymarket markets (configurable). New tables: `polymarket_markets`, `polymarket_snapshots`. Dual sync: mirror worker for UI odds + legacy cron for historical charts. Feature flag: `ENABLE_POLYMARKET`. Read `COMO_ATIVAR_POLYMARKET.md` for setup.
- **Trade Preview System**: Implemented `/api/orders/preview` endpoint for accurate share estimation before placing bets. Frontend shows real-time preview with debounce (500ms) and AbortController to prevent race conditions.
- **Loading States**: Added skeleton loader during preview fetch and spinner on "Palpitar" button. Fixed critical bug where loading state would hang when input was cleared.
- **PT-BR Error Messages**: Complete translation of all backend error messages to Portuguese via centralized `errorMessages` object (23 constants).
- **Toast Testability**: Added `data-testid` attributes to Toast component for automated testing detection.

## User Preferences
- **Communication Style**: I prefer clear and concise language. Avoid overly technical jargon unless necessary, and provide explanations when complex concepts are introduced.
- **Workflow Preferences**: I prefer an iterative development approach. For significant changes or new features, please outline the plan and seek confirmation before implementation.
- **Interaction Preferences**: Ask for confirmation before making major architectural changes or deleting existing code. Provide regular updates on progress and any blockers encountered.
- **Coding Style**: I prefer clean, readable, and well-documented code. Adhere to the established tech stack and design patterns.
- **General Working Preferences**: Ensure all deliverables meet the defined requirements and are thoroughly tested. Prioritize security and performance in all implementations.

## System Architecture

### UI/UX Decisions
The platform utilizes a vibrant Brazilian color scheme with a "verde-turquesa" primary, "amarelo dourado" secondary, and "roxo vibrante" accent. Typography includes Inter for body text and data, Outfit for titles and the AI assistant, and Roboto Mono for numerical values. All components strictly follow `design_guidelines.md`, ensuring consistent spacing, Shadcn UI component usage, an elevation system, full responsiveness, and visual states for loading, error, and empty content.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Authentication**: Passport.js with sessions
- **Hybrid Market Architecture**:
    - **Primary**: 6 AMM markets (CPMM + 2% spread) - full trading functionality
    - **Pilot**: 4 Polymarket markets (Beta) - mirror system with freeze/unfreeze logic
- **Polymarket Mirror System**:
    - **Freeze Protection**: Odds freeze when spike ≥5% in 1 min, display shows last stable value
    - **Automatic Unfreeze**: After 2 consecutive stable readings (<5% delta) OR 120s fail-safe timeout
    - **YES/NO by Name**: Outcomes identified by name (case-insensitive), never by position
    - **Invisible Spread**: Users see pure Polymarket odds; 2% spread applied only at execution
    - **Dual Sync**: Mirror worker (60s polling for UI) + legacy cron (historical snapshots for charts)
- **Prediction Market Core (AMM-based MVP)**:
    - **Dynamic AMM Pricing (CPMM)**: Constant Product Market Maker formula with 2% spread. Prices adjust dynamically based on trades, ensuring market equilibrium.
    - **Trade Preview System**: Public `/api/orders/preview` endpoint performs dry-run AMM calculations, showing users exact share estimates before placing bets. Frontend integration with 500ms debounce and AbortController prevents race conditions.
    - **6 Fixed Markets**: Platform seeds exactly 6 markets mirroring Polymarket: Lula 2026 (45%), Shutdown (32%), Trump 2025 (99%), Bitcoin $100k (68%), IA Jobs (15%), Copa 2030 (8%).
    - **Instant-Fill Market Orders**: All orders instantly filled via AMM, marked as status="filled", and appear in recent trades feed.
    - **5-Tab Navigation**: Trending tab shows top 4 markets by volume. Category tabs: Política (3 markets), Crypto (1), Tech (1), Sports (1).
    - **Localization**: Full PT-BR localization for all UI elements and backend error messages (23 errorMessages constants).
    - **Recent Activity Feed**: Real-time display of recent filled orders with auto-refresh (5s polling).

### Feature Specifications
- **Authentication**: Email/password login/registration, unique username setup post-login, protected routes, and admin-specific routes.
- **Public Landing Page**: Polymarket-style homepage with public access, 5-tab navigation (Trending + 4 categories), and real-time market odds display. Trending shows top 4 markets by volume.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, Reddit-style discussion system, and integration with the trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, real-time preview of share estimates (debounced 500ms), skeleton loading states, automatic calculation of cost, potential gain, and profit using AMM dry-run.
- **Portfolio**: Overview of total value, invested amount, P&L, active positions with per-position P&L, mock wallet (Pix and USDC), and transaction history.
- **AI Assistant (Cachorro)**: Floating chat with GPT-5 (via Replit AI Integrations) offering context-aware responses, quick actions (explain odds, how it works, sentiment analysis, market recommendations).
- **Admin Panel**: Functionality to create new markets and resolve closed markets (YES/NO/CANCELLED).

### System Design Choices
- **E2E Validation**: Extensive E2E testing using Playwright covers user journeys from registration to trading, portfolio management, and admin functions.
- **Cache Invalidation**: TanStack Query is configured for efficient cache invalidation, ensuring real-time data updates.
- **Mocked Features**: Pix and Crypto payments are mocked for the MVP, as is the manual resolution of markets by an admin, with plans for real integration and decentralized oracles in future versions.

## External Dependencies
- **Database**: PostgreSQL (hosted on Neon)
- **AI**: OpenAI (via Replit AI Integrations for GPT-5)
- **Frontend Frameworks/Libraries**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend Libraries**: Node.js, Express, Drizzle ORM, Passport.js, scrypt