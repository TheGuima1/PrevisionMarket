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
- **BRL3 Token Integration (Polygon Direct)**: Direct on-chain integration with BRL3 ERC-20 token using ethers.js and meta-transactions (EIP-2612).
  - **Architecture**: Direct blockchain interaction (no intermediary service)
  - **Mint Operations**: Admin wallet mints tokens directly to user + admin wallets (dual mint)
  - **Burn Operations**: Gasless burns using EIP-2612 permit signatures (user doesn't pay gas)
  - **Admin Wallet**: Configured via `ADMIN_PRIVATE_KEY` environment variable
  - **Contract**: ERC-20 with Permit and Burnable extensions (address in `TOKEN_CONTRACT_ADDRESS`)
  - **RPC Provider**: Polygon Mainnet via `POLYGON_RPC_URL` (Alchemy/Infura recommended)
  - **User Wallets**: Each user must configure `walletAddress` (Polygon address) in profile
  - **Permit Flow**: User signs off-chain permit → Admin executes permit + transferFrom + burn (all gas paid by admin)
  - **Implementation**: `server/polygonClient.ts`, `server/brl3-client.ts`, `client/src/lib/polygonUtils.ts`
  - **Documentation**: See `POLYGON_INTEGRATION_SETUP.md` for complete setup guide
- **Manual Deposit Approval Workflow**: Deposits require admin approval. Users upload PDF proofs, which admins review and approve/reject. Approval triggers dual mint via X-CHANGE API, executing on-chain immediately and updating local balance.
- **Manual Withdrawal Approval Workflow**: Withdrawals require admin approval. Users submit requests with PIX keys (wallet address optional). System supports two paths: (1) Users with MetaMask + configured wallet sign EIP-2612 permit for gasless on-chain burn; (2) Users without MetaMask/wallet submit request for manual admin processing. No balance validation at request time - admin verifies before approval. Approval triggers dual burn via X-CHANGE API, executing on-chain immediately and updating local balance.
- **Dynamic Market Management**: An admin panel allows dynamic creation, validation, and removal of Polymarket-mirrored markets. A mirror worker automatically syncs odds from Polymarket.
- **Polymarket Adapter**: Fetches market data from Polymarket's Gamma API with a 5-minute cache, extracting YES probabilities for pricing.
- **Prediction Market Core**: Implements dynamic AMM pricing using the Constant Product Market Maker formula with a 2% spread. Orders are instantly filled with real-time share estimates.
- **Localization**: Full PT-BR localization for UI and backend messages.

### Feature Specifications
- **Authentication**: Standard email/password login/registration with unique usernames and protected routes. Admin quick access via password-only login.
- **Public Landing Page**: Displays available markets with real-time Polymarket odds.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, discussion system, and integrated trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, real-time share estimate preview, cost, potential gain, and profit calculation.
- **Portfolio**: Overview of total value, invested amount, P&L, active positions, wallet management (deposit/withdrawal requests), and transaction history. Withdrawal flow includes MetaMask integration for EIP-2612 permit signatures.
- **Profile Page**: User profile management with wallet address configuration. Users configure their Polygon wallet address (required for BRL withdrawals). Includes validation, format checking, and helpful instructions.
- **MetaMask Integration**: Complete user-facing wallet integration with network verification (Polygon chainId 137), automatic network switching, gasless EIP-2612 permit signatures for withdrawals, error handling for missing MetaMask or wrong network, and comprehensive loading states.
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