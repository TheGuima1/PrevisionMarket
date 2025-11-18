# Palpites.AI - Plataforma de Prediction Markets com BRL3

## Overview
Palpites.AI is a prediction market platform, inspired by Polymarket, designed for the Brazilian market. Users deposit via PIX, receive BRL3 tokens on-chain, and use them to trade on future events. The project aims to provide a robust, user-friendly, and localized platform with high market potential due to the integration of PIX and a familiar user experience. The MVP features AMM-based pricing (CPMM with 2% spread), decimal odds, trade preview, full PT-BR localization, and production-ready deployment.

## User Preferences
- **Communication Style**: I prefer clear and concise language. Avoid overly technical jargon unless necessary, and provide explanations when complex concepts are introduced.
- **Workflow Preferences**: I prefer an iterative development approach. For significant changes or new features, please outline the plan and seek confirmation before implementation.
- **Interaction Preferences**: Ask for confirmation before making major architectural changes or deleting existing code. Provide regular updates on progress and any blockers encountered.
- **Coding Style**: I prefer clean, readable, and well-documented code. Adhere to the established tech stack and design patterns.
- **General Working Preferences**: Ensure all deliverables meet the defined requirements and are thoroughly tested. Prioritize security and performance in all implementations.

## System Architecture

### UI/UX Decisions
The platform utilizes a **Purple Tech Masculino** design with neutral gray-purple backgrounds, deep saturated purple accents, and distinct action colors. It prioritizes masculine appeal, tech seriousness, and financial expertise through deeper tones and stronger saturation. Typography includes Inter, Manrope, and Roboto Mono. Both light and dark modes are supported. All components strictly follow `design_guidelines.md`, ensuring consistency, professional appeal, Shadcn UI component usage, and full responsiveness. The Admin Panel features a dark theme matching this visual identity.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Authentication**: Passport.js with sessions
- **BRL3 Token Integration (Polygon Direct)**: Direct on-chain integration with BRL3 ERC-20 token using ethers.js. Admin controls all on-chain operations via backend-only flow (no MetaMask required).
  - **Architecture**: Admin-only custody model - all BRL3 tokens remain in admin wallet, users have database balances only
  - **Mint Operations (Deposits)**: Backend uses ADMIN_PRIVATE_KEY to call `mintTo()` minting tokens to admin wallet. User's database balance credited. No user wallet or MetaMask needed.
  - **Burn Operations (Withdrawals)**: Backend uses ADMIN_PRIVATE_KEY to call `burnFromAdmin()` burning tokens from admin wallet. User's database balance debited. Admin processes PIX transfer separately.
  - **Admin Wallet**: Configured via `ADMIN_PRIVATE_KEY` environment variable (must be contract owner). Admin pays all gas fees.
  - **Contract**: ERC-20 with Burnable extension and Ownable access control (address in `TOKEN_CONTRACT_ADDRESS`)
  - **RPC Provider**: Polygon Mainnet via `POLYGON_RPC_URL` (Alchemy/Infura recommended)
  - **User Balance**: Internal database balance only. Users do NOT hold tokens in personal wallets. All tokens remain in admin custody.
  - **Implementation**: `server/polygonClient.ts` (blockchain operations), `server/brl3-client.ts` (business logic), `server/routes.ts` (API endpoints)
  - **Documentation**: See `POLYGON_INTEGRATION_SETUP.md` for complete setup guide
- **Manual Deposit Approval Workflow**: Users upload PIX proof (PDF). Admin clicks "Aprovar" in admin panel. Backend automatically calls `notifyMintToBRL3()` using ADMIN_PRIVATE_KEY to mint tokens to admin wallet. User's database balance credited. No MetaMask or user interaction required.
- **Manual Withdrawal Approval Workflow**: Users request withdrawal with PIX key. Admin clicks "Aprovar" in admin panel. Backend automatically calls `notifyBurnToBRL3()` using ADMIN_PRIVATE_KEY to burn tokens from admin wallet. User's database balance debited. Admin processes PIX transfer separately. No MetaMask or user interaction required.
- **Dynamic Market Management**: An admin panel allows dynamic creation, validation, and removal of Polymarket-mirrored markets. A mirror worker automatically syncs odds from Polymarket.
- **Polymarket Adapter**: Fetches market data from Polymarket's Gamma API with a 5-minute cache, extracting YES probabilities for pricing.
- **Prediction Market Core**: Implements dynamic AMM pricing using the Constant Product Market Maker formula with a 2% spread. Orders are instantly filled with real-time share estimates.
- **Localization**: Full PT-BR localization for UI and backend messages.

### Feature Specifications
- **Authentication**: Standard email/password login/registration with unique usernames and protected routes. Admin quick access via password-only login.
- **Public Landing Page**: Displays available markets with real-time Polymarket odds. Features special grouped display for multi-candidate markets like "Eleição Presidencial Brasil 2026" showing **8 candidates** (Lula, Tarcísio, Haddad, Renan Santos, Ratinho Jr, Jair Bolsonaro, Michelle Bolsonaro, Eduardo Bolsonaro) with **authentic Polymarket price changes** synchronized every 60 seconds. Data includes daily/weekly price deltas and real-time volumes - no simulated historical charts.
- **Brazil Election Event Page** (`/brazil-election-2026`): Dedicated page matching Polymarket's event layout, featuring all 8 presidential candidates in a unified view. Includes summary bar with colored candidate dots, chart placeholder (linking to Polymarket due to X-Frame-Options restrictions), and detailed candidate rows with Buy Yes/No buttons. Navigation flows from homepage card to event page to individual market detail pages.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, discussion system, and integrated trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, real-time share estimate preview, cost, potential gain, and profit calculation. Includes balance validation - button disabled when user has insufficient balance with "Saldo insuficiente" message.
- **Portfolio**: Overview of total value, invested amount, P&L, active positions, wallet management (deposit/withdrawal requests), and transaction history. Users submit withdrawal requests with PIX key - admin processes on-chain burn operations.
- **Profile Page**: User profile management including username, email, and account settings. Displays information about admin-custody model - users do NOT need to configure wallets as all tokens remain in admin custody.
- **Backend-Only Blockchain Integration**: All blockchain operations (mint/burn) happen server-side using ADMIN_PRIVATE_KEY. No MetaMask, no browser wallet, no user interaction with blockchain. Admin panel simply triggers backend API endpoints.
- **On-chain Operations Logging**: All BRL3 mint/burn operations are automatically logged to the `onchain_operations` table with complete audit trail including transaction hashes, status transitions (pending → confirmed/failed), timestamps, and error messages. Covers admin-only functions: `notifyMintToBRL3` (deposits) and `notifyBurnToBRL3` (withdrawals). Pre-transaction errors (disabled Polygon, missing wallet, RPC failures) are captured and logged as "failed" status.
- **AI Assistant (Cachorro)**: Floating chat powered by GPT-5 (via Replit AI Integrations) offering context-aware responses and market recommendations.
- **Admin Panel**: Redesigned dark-themed interface for managing deposits, withdrawals, markets (manual and Polymarket mirrors), and users. Includes secure logout.

### System Design Choices
- **E2E Validation**: Extensive Playwright E2E tests cover critical user journeys.
- **Cache Invalidation**: TanStack Query is configured for efficient cache invalidation.
- **Mocked Features**: Pix and Crypto payments, along with manual market resolution, are mocked for the MVP.
- **Pricing Strategy**: Palpites.AI uses Polymarket's "spot price" (consensus market price) from the Gamma API, offering users ~10-15% better odds than Polymarket's execution price, with a transparent 2% platform fee.
- **Production Deployment Optimization**: Asynchronous mirror worker initialization and database seeding prevent deployment health check timeouts, ensuring rapid server startup.
- **Replit Autoscale Health Checks**: Optimized for fast responses with dedicated `/healthz` (no DB) and `/health` (with DB ping) endpoints.

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **AI**: OpenAI (via Replit AI Integrations for GPT-5)
- **Frontend Frameworks/Libraries**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend Libraries**: Node.js, Express, Drizzle ORM, Passport.js, scrypt