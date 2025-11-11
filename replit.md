# Palpites.AI - Plataforma de Prediction Markets com BRL3

## Overview
Palpites.AI is a prediction market platform, inspired by Polymarket, designed for the Brazilian market. Users deposit via PIX, receive BRL3 tokens on-chain, and use them to trade on future events. The project aims to provide a robust, user-friendly, and localized platform for prediction markets, with ambitions for real-time features, advanced trading tools, and decentralized integration in future phases. The MVP is complete, featuring AMM-based pricing (CPMM with 2% spread), decimal odds, trade preview system, full PT-BR localization, and a production-ready deployment. The business vision is to capture the Brazilian prediction market, offering a localized and accessible platform with high market potential due to the integration of PIX and a familiar user experience.

## User Preferences
- **Communication Style**: I prefer clear and concise language. Avoid overly technical jargon unless necessary, and provide explanations when complex concepts are introduced.
- **Workflow Preferences**: I prefer an iterative development approach. For significant changes or new features, please outline the plan and seek confirmation before implementation.
- **Interaction Preferences**: Ask for confirmation before making major architectural changes or deleting existing code. Provide regular updates on progress and any blockers encountered.
- **Coding Style**: I prefer clean, readable, and well-documented code. Adhere to the established tech stack and design patterns.
- **General Working Preferences**: Ensure all deliverables meet the defined requirements and are thoroughly tested. Prioritize security and performance in all implementations.

## System Architecture

### UI/UX Decisions
The platform utilizes a vibrant Brazilian color scheme with "verde-turquesa" primary, "amarelo dourado" secondary, and "roxo vibrante" accent. Typography includes Inter for body, Outfit for titles, and Roboto Mono for numerical values. All components strictly follow `design_guidelines.md`, ensuring consistent spacing, Shadcn UI component usage, an elevation system, full responsiveness, and visual states for loading, error, and empty content.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Authentication**: Passport.js with sessions
- **Unified Market Architecture**: Features exactly 4 Palpites.AI markets (AMM-based with CPMM + 2% spread) that mirror Polymarket odds in real-time (60s polling). An auto-reconciliation mechanism validates market count and slugs on boot, cleaning up legacy markets if discrepancies are detected.
- **Polymarket Mirror System**: Includes a freeze protection mechanism that halts odds display when spikes ≥5% occur within 1 minute, reverting to the last stable value until stability is re-established or a 120s timeout occurs. Outcomes are identified by name (case-insensitive) for robustness. Users see pure Polymarket odds, with a transparent 2% spread applied only at trade execution.
- **Prediction Market Core (AMM-based MVP)**: Implements dynamic AMM pricing using the Constant Product Market Maker formula with a 2% spread. A public `/api/orders/preview` endpoint provides real-time share estimates before trading. The platform seeds 4 fixed markets mirroring Polymarket odds: Lula 2026, Fed rate hike 2025, US Recession 2025, and Fed emergency cut, with metadata centralized in `server/polymarket-metadata.ts`. All orders are instantly filled.
- **Localization**: Full PT-BR localization for all UI elements and backend error messages.

### Feature Specifications
- **Authentication**: Standard email/password login/registration with unique username setup and protected routes.
- **Public Landing Page**: Displays the 4 available markets with real-time Polymarket odds in a simplified layout.
- **Market Detail Page**: Offers comprehensive market information, multiple odds formats, a Reddit-style discussion system, and an integrated trading panel.
- **Trading Panel**: Features a visual YES/NO toggle, quantity input, real-time debounced preview of share estimates, and automatic calculation of cost, potential gain, and profit.
- **Portfolio**: Provides an overview of total value, invested amount, P&L, active positions, a mocked wallet (Pix and USDC), and transaction history.
- **AI Assistant (Cachorro)**: A floating chat powered by GPT-5 (via Replit AI Integrations) offering context-aware responses, quick actions, and market recommendations.
- **Admin Panel**: Facilitates the creation of new markets and the resolution of closed markets.

### System Design Choices
- **E2E Validation**: Extensive Playwright E2E tests cover critical user journeys and admin functions.
- **Cache Invalidation**: TanStack Query is configured for efficient cache invalidation.
- **Mocked Features**: Pix and Crypto payments, along with manual market resolution, are mocked for the MVP.
- **Pricing Strategy (Competitive Advantage)**: Palpites.AI uses Polymarket's "spot price" (consensus market price) from the Gamma API, not their execution price. This gives users ~10-15% better odds than Polymarket's execution price which includes their spread/slippage. For example: Polymarket spot 3.25% vs execution 3.7¢ = 12% better profit for Palpites.AI users. We charge only a transparent 2% platform fee on top of spot price. Tooltips in trade panel explain this advantage to users. Future enhancement: implement dual-price display showing both spot and estimated execution prices for complete transparency.
- **Production Deployment Optimization**: Mirror worker initialization runs asynchronously to prevent deployment health check timeouts. Server startup completes in ~5 seconds while Polymarket slug validation and initial data sync occur in the background. This ensures rapid deployment while maintaining data integrity (markets are pre-seeded via `autoSeedIfEmpty()` before traffic).

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **AI**: OpenAI (via Replit AI Integrations for GPT-5)
- **Frontend Frameworks/Libraries**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend Libraries**: Node.js, Express, Drizzle ORM, Passport.js, scrypt