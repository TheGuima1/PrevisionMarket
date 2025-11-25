# Palpites.AI - Plataforma de Prediction Markets

## Overview
Palpites.AI is a prediction market platform, inspired by Polymarket, designed for the Brazilian market. Its purpose is to allow users to deposit funds via PIX and trade on future events. The project aims to deliver a robust, user-friendly, and localized platform with high market potential due to its PIX integration and familiar user experience. Key capabilities include AMM-based pricing (CPMM with 2% spread), decimal odds, trade preview, full PT-BR localization, and production-ready deployment.

## User Preferences
- **Communication Style**: I prefer clear and concise language. Avoid overly technical jargon unless necessary, and provide explanations when complex concepts are introduced.
- **Workflow Preferences**: I prefer an iterative development approach. For significant changes or new features, please outline the plan and seek confirmation before implementation.
- **Interaction Preferences**: Ask for confirmation before making major architectural changes or deleting existing code. Provide regular updates on progress and any blockers encountered.
- **Coding Style**: I prefer clean, readable, and well-documented code. Adhere to the established tech stack and design patterns.
- **General Working Preferences**: Ensure all deliverables meet the defined requirements and are thoroughly tested. Prioritize security and performance in all implementations.

## System Architecture

### UI/UX Decisions
The platform uses a **Purple Tech Masculino** design with a color palette of neutral gray-purple backgrounds, deep saturated purple accents, and distinct action colors, aiming for a masculine, tech-serious, and financially expert appeal. Typography includes Inter, Manrope, and Roboto Mono. Both light and dark modes are supported, and all components adhere to `design_guidelines.md` using Shadcn UI.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI.
- **Backend**: Node.js, Express with a dedicated blockchain service module.
- **Database**: PostgreSQL (Supabase) via Drizzle ORM.
- **Blockchain**: Polygon Mainnet integration with BRL3 ERC20 token contract (`0xa2a21D5800E4DA2ec41582C10532aE13BDd4be90`) using ethers.js v6 for backend-only mint/burn operations via `ADMIN_PRIVATE_KEY`.
- **Authentication**: Passport.js with sessions.
- **Token Architecture**: Users manage database-managed BRL3 balances (1:1 with real BRL) after PIX deposits, with actual tokens remaining in an admin wallet.
- **Dynamic Market Management**: Admin panel allows dynamic creation, validation, and removal of Polymarket-mirrored markets. An **Event Sync Worker** (`server/mirror/event-sync-worker.ts`) syncs complete events and creates probability snapshots for charts.
- **Polymarket Adapter**: Fetches market data from Polymarket's Gamma API with a 10-minute cache.
- **Prediction Market Core**: Implements dynamic AMM pricing using the Constant Product Market Maker formula with a 3% platform fee.
- **Localization**: Full PT-BR localization for UI and backend messages.

### Feature Specifications
- **Authentication**: Email/password login/registration with unique usernames and protected routes.
- **KYC (Know Your Customer)**: Tier 1 identity verification integrated into the onboarding flow for Brazilian users.
- **Public Landing Page**: Displays available markets with real-time Polymarket odds using a unified "top-2" card format.
- **Event Pages**: Dedicated pages for events like Brazil Election 2026, featuring detailed market information, price charts (top-4 favorites), and trading options.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, discussion system, and integrated trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, real-time share estimate, cost, potential gain, and profit calculation with balance validation.
- **Portfolio**: Overview of total value, invested amount, P&L, active positions, wallet management, and transaction history.
- **Profile Page**: User profile management including username, email, and account settings.
- **AI Assistant (Cachorro)**: Floating chat powered by GPT-5 (via Replit AI Integrations) offering context-aware responses.
- **Admin Panel**: Dark-themed interface for managing deposits, withdrawals, blockchain token operations, markets, users, and platform fee revenue tracking. Includes a "Receita de Taxas" section.
- **Category Navigation System**: Category-based market navigation with 5 dedicated pages: `/markets`, `/categoria/politica`, `/categoria/esportes`, `/categoria/eua`, `/categoria/cripto`.
- **Unified Top-2 Visual Format**: All markets display with identical top-2 card format on the home page, including virtual options for binary markets.
- **Silent Fee Deduction**: The 3% platform fee is silently deducted from trades, visible only to admins.

### System Design Choices
- **E2E Validation**: Extensive Playwright E2E tests.
- **Cache Invalidation**: TanStack Query for efficient cache invalidation.
- **Mocked Features**: Pix and Crypto payments, along with manual market resolution, are mocked for MVP.
- **Pricing Strategy**: Uses Polymarket's "spot price" with a 3% platform fee.
- **Production Deployment Optimization**: Asynchronous mirror worker initialization and database seeding to prevent timeouts.
- **Replit Autoscale Health Checks**: Optimized with `/healthz` and `/health` endpoints.
- **Blockchain Integration Reliability**: Comprehensive validation, error handling, and pragmatic rollback strategies for all blockchain operations, including detailed reconciliation logging.
- **Historical Price Data Backfill**: Integration of historical price snapshots from Polymarket CLOB API.

## External Dependencies
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: Polygon Mainnet (via ethers.js v6)
- **AI**: OpenAI (via Replit AI Integrations for GPT-5)
- **Frontend Frameworks/Libraries**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend Libraries**: Node.js, Express, Drizzle ORM, Passport.js, scrypt, ethers