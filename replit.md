# Palpites.AI - Plataforma de Prediction Markets com BRL3

## Overview
Palpites.AI is a prediction market platform, inspired by Polymarket, designed for the Brazilian market. Users deposit via PIX, receive BRL3 tokens on-chain, and use them to trade on future events. The project aims to provide a robust, user-friendly, and localized platform for prediction markets, with ambitions for real-time features, advanced trading tools, and decentralized integration in future phases. The MVP is complete, featuring AMM-based pricing (CPMM with 2% spread), decimal odds, trade preview system, full PT-BR localization, and a production-ready deployment.

## Recent Changes (November 2025)
- **Transparent 2% Platform Fee (Nov 11)**: Refactored fee architecture to display platform fee separately and transparently in trade panel UI. Modified `buyShares` in `server/amm-engine.ts` to use full stake for share calculation, extracting 2% fee separately (not reducing buying power). Added "Taxa Palpites.AI (2%)" line item in both YES/NO tabs of `client/src/components/trade-panel.tsx` showing stakeBRL * 0.02. Backend creates separate "platform_fee" transaction type for transparent accounting. Preview endpoint returns platformFee for UI display. Odds calculations use raw probability (no rounding artifacts) to maintain exact 1:1 parity with Polymarket. Formula: shares = stake / polymarket_price, fee = stake * 0.02 (separate). Example: 100 BRL3 at 14% → 714 shares, 2 BRL3 fee. Database migration added "platform_fee" to transaction_type enum. E2E tests confirm: fee visible in UI, correct calculation (2% of stake), platform_fee transaction persisted. Production-ready with architect approval.
- **Unified 4-Market Architecture with Auto-Reconciliation (Nov 11)**: Completed major refactor from dual-system (6 AMM + 4 Polymarket) to unified model showing exactly 4 Palpites.AI markets mirroring Polymarket odds. Created `server/polymarket-metadata.ts` as single source of truth mapping slugs to PT-BR metadata (titles, categories, descriptions). Implemented auto-reconciliation in `autoSeedIfEmpty()`: validates market count and slugs on boot, wipes legacy markets if mismatch detected, and reseeds with correct 4 markets. Simplified HomePage to show only "Mercados Disponíveis" section with 4 market cards—zero Polymarket branding visible to users. System guarantees N markets = N configured slugs (currently 4). E2E tests confirm: exactly 4 markets displayed with correct Polymarket odds (Lula 14%, Recessão 4.3%, Fed juros 0.9%, Fed emergencial 3.3%). Production-ready with architect approval. Migration-safe: existing deployments auto-clean on next boot.
- **Fixed AMM Seed with Real Polymarket Odds (Nov 11)**: Fixed critical production bug where AMM markets displayed 50/50 odds instead of Polymarket odds. Modified `server/seed.ts` to fetch real Polymarket odds via `fetchPolyBySlug()` during database seeding. Markets with `polymarketSlug` now bootstrap with correct reserves (e.g., Lula at 14% YES instead of 50/50). Updated `server/routes.ts` to start mirror worker automatically when `POLYMARKET_SLUGS` is configured (independent of `ENABLE_POLYMARKET` flag). System uses 10,000 liquidity scale for smooth AMM operations. Robust error handling: falls back to 50/50 if Polymarket fetch fails. E2E tests confirm: Lula 14%, Recessão 4.3%, Fed juros 0.9%, Fed emergencial 3.3%. Production-ready with architect approval.
- **Unified AMM Pricing & Historical Charts (Nov 11)**: Completed MVP AMM pricing system that displays EXACT Polymarket odds to users with transparent 2% platform fee shown separately. Created `amm-pricing.ts` service with `calculateAMMPricing()` that returns displayProbability (pure Polymarket), netShares (after 2% fee), and payout values. Fixed preview endpoint bug: 100 BRL3 now returns ~725 shares (was 0). Implemented `amm_snapshots` table with timestamp indexing for probability history. Added `/api/markets/:id/history` endpoint and Recharts probability chart on AMM market detail pages. Removed all spread disclaimers from UI per user requirement. E2E tests confirm: preview shows non-zero shares/payout, chart renders with SIM/NÃO lines, odds match Polymarket exactly (14% → 7.14 decimal). Production-ready with architect approval.
- **AMM Real-Time Sync with Polymarket (Nov 11)**: Fixed production bug where all AMM markets showed 50/50 odds. Implemented automatic sync system (`server/amm-sync.ts`) that updates local AMM market reserves with live Polymarket odds every 60 seconds. Added `polymarket_slug` mappings to 4 markets: Fed rate hike (1.1%), Lula election (14%), US recession (4.0%), Fed emergency cut (2.8%). System uses fetch caching to avoid duplicate API calls and isolated error handling to prevent blocking mirror updates. Production-ready with architect approval.
- **Simplified Betting Model - MVP (Nov 11)**: Refactored to simple odds-based betting system. **BRL3 = internal credit** (1 BRL3 = 1 BRL on withdrawal), not blockchain. Platform mirrors Polymarket odds + 2% transparent platform fee (displayed separately in UI). Formula: `shares = stake / polymarket_price, fee = stake * 0.02`. Example: 100 BRL3 at 14% → 714 shares + 2 BRL3 fee → +614 BRL3 profit if wins. Removed complex CPMM logic. Reserves now static (price discovery from Polymarket mirror only). Platform acts as "the house" (no counterparties needed). Payout: 1 share = 1 BRL3 guaranteed by platform.
- **Mirror System with Auto-Validation (Nov 10)**: Enhanced mirror worker with boot-time slug validation. System auto-excludes invalid slugs (404/410) and logs consolidated warning, preventing log pollution. Keeps slugs with transient errors (network, rate limit) for retry. Added feature flag `ENABLE_POLYMARKET_CRON` (default: false) to disable legacy snapshot system. Mirror worker now validates slugs before starting, ensuring only valid markets are polled.
- **Mirror System with Freeze/Unfreeze (Nov 10)**: Implemented new mirror architecture for Polymarket integration. Guarantees YES/NO identification by **name** (case-insensitive), never by array position. Freeze logic: when odds spike ≥5% in 1 minute, display freezes at last stable value until 2 consecutive stable readings (<5% delta) OR 120s timeout. Dual-path stability check handles anchor reversion, new plateau formation, oscillation rejection, and gradual drift reseeding. New files: `server/mirror/adapter.ts`, `server/mirror/state.ts`, `server/mirror/worker.ts`. Platform fee (2%) now transparently displayed in UI - shown as separate line item in trade panel. System displays pure Polymarket odds in UI.
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
- **Unified Market Architecture**:
    - **Single System**: Exactly 4 Palpites.AI markets (AMM-based with CPMM + 2% spread)
    - **Auto-Reconciliation**: System validates market count/slugs on boot, auto-cleans legacy markets
    - **Polymarket Mirror**: All 4 markets mirror Polymarket odds in real-time (60s polling)
- **Polymarket Mirror System**:
    - **Freeze Protection**: Odds freeze when spike ≥5% in 1 min, display shows last stable value
    - **Automatic Unfreeze**: After 2 consecutive stable readings (<5% delta) OR 120s fail-safe timeout
    - **YES/NO by Name**: Outcomes identified by name (case-insensitive), never by position
    - **Invisible Spread**: Users see pure Polymarket odds; 2% spread applied only at execution
    - **Dual Sync**: Mirror worker (60s polling for UI) + legacy cron (historical snapshots for charts)
- **Prediction Market Core (AMM-based MVP)**:
    - **Dynamic AMM Pricing (CPMM)**: Constant Product Market Maker formula with 2% spread. Prices adjust dynamically based on trades, ensuring market equilibrium.
    - **Trade Preview System**: Public `/api/orders/preview` endpoint performs dry-run AMM calculations, showing users exact share estimates before placing bets. Frontend integration with 500ms debounce and AbortController prevents race conditions.
    - **4 Fixed Markets**: Platform seeds exactly 4 markets mirroring Polymarket: Lula 2026 (14%), Fed rate hike 2025 (0.9%), US Recession 2025 (4.3%), Fed emergency cut (3.3%). Metadata centralized in `server/polymarket-metadata.ts`.
    - **Instant-Fill Market Orders**: All orders instantly filled via AMM, marked as status="filled", and appear in recent trades feed.
    - **Simplified UI**: Homepage shows single "Mercados Disponíveis" section with 4 market cards. No tabs, no Polymarket branding.
    - **Localization**: Full PT-BR localization for all UI elements and backend error messages (23 errorMessages constants).
    - **Recent Activity Feed**: Real-time display of recent filled orders with auto-refresh (5s polling).

### Feature Specifications
- **Authentication**: Email/password login/registration, unique username setup post-login, protected routes, and admin-specific routes.
- **Public Landing Page**: Clean homepage with public access showing 4 available markets with real-time Polymarket odds. No tabs, simplified single-section layout.
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