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
The platform uses a **Purple Tech Masculino** design with a color palette of neutral gray-purple backgrounds, deep saturated purple accents, and distinct action colors. It aims for a masculine, tech-serious, and financially expert appeal. Typography includes Inter, Manrope, and Roboto Mono. Both light and dark modes are supported. All components adhere to `design_guidelines.md`, utilizing Shadcn UI components for consistency and responsiveness. The Admin Panel features a matching dark theme.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express with dedicated blockchain service module (`server/blockchain.ts`) for mint/burn operations
- **Database**: PostgreSQL (Supabase) via Drizzle ORM with a hybrid driver architecture (postgres.js for Drizzle, pg.Pool for session store).
- **Blockchain**: Polygon Mainnet integration with BRL3 ERC20 token contract (`0xa2a21D5800E4DA2ec41582C10532aE13BDd4be90`) using ethers.js v6. The token features OpenZeppelin's Ownable (owner-only mint/burn/pause), Pausable emergency controls, and ERC20Burnable extensions. **Backend-only operations**: All mint/burn operations execute via backend using `ADMIN_PRIVATE_KEY` environment variable through dedicated `BlockchainService` class. Admin approves deposits/withdrawals via REST endpoints (`/api/deposits/:id/approve`, `/api/withdrawals/:id/approve`) which automatically trigger blockchain operations. Token routes (`/api/token/*`) provide admin balance checks and manual operations. Decimal precision (18) is handled via `ethers.parseUnits`/`formatUnits`.
- **Authentication**: Passport.js with sessions.
- **Token Architecture**: Users receive database-managed BRL3 balances (1:1 with real BRL) after PIX deposits. Actual tokens remain in admin wallet for accounting purposes. Admin backend service mints tokens to admin wallet when approving deposits and burns from admin wallet when approving withdrawals. No user wallets or MetaMask required for end users.
- **Dynamic Market Management**: Admin panel allows dynamic creation, validation, and removal of Polymarket-mirrored markets. A mirror worker syncs odds from Polymarket.
- **Polymarket Adapter**: Fetches market data from Polymarket's Gamma API with a 10-minute cache.
- **Prediction Market Core**: Implements dynamic AMM pricing using the Constant Product Market Maker formula with a 2% spread.
- **Localization**: Full PT-BR localization for UI and backend messages.

### Feature Specifications
- **Authentication**: Standard email/password login/registration with unique usernames and protected routes. Admin quick access via password-only login.
- **KYC (Know Your Customer)**: Tier 1 identity verification integrated into the onboarding flow, collecting full name, CPF, birth date, phone, and Brazilian address. Validation enforces correct formats.
- **Public Landing Page**: Displays available markets with real-time Polymarket odds, including special grouped displays for multi-candidate markets like "Eleição Presidencial Brasil 2026" featuring 8 candidates with authentic Polymarket price changes synchronized every 5 minutes.
- **Brazil Election Event Page** (`/brazil-election-2026`): Dedicated page matching Polymarket's event layout, featuring all 8 presidential candidates, a professional probability chart (top 4 candidates), and detailed candidate rows with Buy Yes/No buttons.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, discussion system, and integrated trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, real-time share estimate preview, cost, potential gain, and profit calculation with balance validation.
- **Portfolio**: Overview of total value, invested amount, P&L, active positions, wallet management (deposit/withdrawal requests), and transaction history.
- **Profile Page**: User profile management including username, email, and account settings.
- **AI Assistant (Cachorro)**: Floating chat powered by GPT-5 (via Replit AI Integrations) offering context-aware responses and market recommendations.
- **Admin Panel**: Dark-themed interface for managing deposits, withdrawals, blockchain token operations (mint/burn via MetaMask), markets, and users, including secure logout.

### System Design Choices
- **E2E Validation**: Extensive Playwright E2E tests for critical user journeys.
- **Cache Invalidation**: TanStack Query configured for efficient cache invalidation.
- **Mocked Features**: Pix and Crypto payments, along with manual market resolution, are mocked for the MVP.
- **Pricing Strategy**: Uses Polymarket's "spot price" from the Gamma API, offering users ~10-15% better odds than Polymarket's execution price, with a 2% platform fee.
- **Production Deployment Optimization**: Asynchronous mirror worker initialization and database seeding to prevent deployment health check timeouts.
- **Replit Autoscale Health Checks**: Optimized with `/healthz` (no DB) and `/health` (with DB ping) endpoints.
- **Code Cleanup**: Repository cleaned of unused assets, legacy routes, and duplicated code.
- **Deposit/Withdrawal Route Consistency**: Both deposit and withdrawal routes use consistent `ADMIN_WALLET_ADDRESS` environment variable fallback chain (validated.walletAddress → process.env.ADMIN_WALLET_ADDRESS → ADMIN_WALLET_ADDRESS constant). Fixed critical bug where redundant dynamic import in deposit route caused silent failures. Both routes now use static imports for optimal performance and reliability.
- **Blockchain Integration Reliability**: Comprehensive validation and error handling implemented for all blockchain operations:
  - **Startup Validation**: Verifies ADMIN_PRIVATE_KEY format, RPC connectivity, and contract ownership before server starts
  - **Preflight Balance Checks**: Admin wallet balance verified before burn operations to prevent DoS attacks
  - **Pragmatic Rollback Strategy**: Deposit/withdrawal approval workflows track state granularly (approved, balanceUpdated, transactionCreated) and implement explicit rollback on DB failures - balance changes are reverted and requests marked as rejected with full txHash and error context for manual reconciliation
  - **Detailed Reconciliation Logging**: All edge cases (blockchain success + DB failure) log structured reconciliation data (depositId, userId, amount, txHash, failure reason) to enable operational monitoring and manual remediation
  - **Production-Viable**: Implementation is production-ready with operational processes for monitoring logs and manually reconciling edge cases where blockchain succeeded but DB operations failed

## External Dependencies
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: Polygon Mainnet (via ethers.js v6)
- **AI**: OpenAI (via Replit AI Integrations for GPT-5)
- **Frontend Frameworks/Libraries**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend Libraries**: Node.js, Express, Drizzle ORM (postgres.js driver), Passport.js (pg.Pool for sessions), scrypt, ethers