# Palpites.AI - Plataforma de Prediction Markets

## Overview
Palpites.AI is a prediction market platform, inspired by Polymarket, designed for the Brazilian market. Users deposit via PIX and use their balance to trade on future events. The project aims to provide a robust, user-friendly, and localized platform with high market potential due to the integration of PIX and a familiar user experience. The MVP features AMM-based pricing (CPMM with 2% spread), decimal odds, trade preview, full PT-BR localization, and production-ready deployment.

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
- **Database**: PostgreSQL (Supabase) via Drizzle ORM with hybrid driver architecture (postgres.js for Drizzle, pg.Pool for session store)
- **Blockchain**: Polygon Mainnet integration with BRL3 ERC20 token contract using ethers.js v6. **MetaMask is REQUIRED** for all deposit/withdrawal approvals - the extension opens automatically showing mint/burn transaction details for admin confirmation. All token routes (`/api/token/*`) are protected with `requireAuth` + `requireAdmin` middleware for security. Decimal precision handled via `ethers.parseUnits`/`formatUnits` to prevent floating-point errors.
- **Authentication**: Passport.js with sessions
- **MetaMask-First Deposit Workflow** (BRL3 tokens minted to admin wallet):
  1. User uploads PIX proof (PDF) → Status: pending
  2. Admin clicks "APROVAR → Mint via MetaMask" button
  3. **MetaMask extension opens automatically** showing exact token amount to mint (e.g., "Mint 100.00 BRL3")
  4. Admin confirms mint transaction in MetaMask popup (tokens minted to admin's MetaMask wallet)
  5. Frontend calls `POST /api/deposits/:id/confirm-mint` with blockchain txHash
  6. Backend verifies deposit is pending, updates user balance (+amount), creates transaction record with txHash, marks deposit as approved
  7. User sees credited balance in app, admin holds BRL3 tokens in MetaMask
- **MetaMask-First Withdrawal Workflow** (BRL3 tokens burned from admin wallet):
  1. User requests withdrawal with PIX key → Status: pending
  2. Admin clicks "APROVAR → Burn via MetaMask" button
  3. **MetaMask extension opens automatically** showing exact token amount to burn (e.g., "Burn 50.00 BRL3")
  4. Admin confirms burn transaction in MetaMask popup (tokens burned from admin's MetaMask wallet)
  5. Frontend calls `POST /api/withdrawals/:id/confirm-burn` with blockchain txHash
  6. Backend verifies withdrawal is pending, validates user balance, deducts balance (-amount), creates transaction record with txHash, marks withdrawal as approved
  7. Admin processes PIX transfer manually via bank, user sees deducted balance in app
- **Blockchain Token Management**: Admin panel includes dedicated "Blockchain (MetaMask)" tab for optional manual mint/burn operations outside the deposit/withdrawal flow. Features automatic Polygon network detection/switching, MetaMask wallet connection, real-time BRL3 balance display, mint/burn interfaces with transaction hash links to Polygonscan, and comprehensive error handling. Event listeners detect account/chain changes for proper state management.
- **MetaMask Architecture (Nov 2025 Refactor)**: Complete rebuild of MetaMask integration with robust state management:
  - **MetaMaskContext**: Global state provider with reducer pattern managing 7 states (not-installed, iframe-blocked, locked, needs-approval, ready, wrong-network, connecting)
  - **Iframe Detection**: Automatically detects Replit iframe context and shows "Open in new tab" alert with one-click button
  - **Event Listeners**: Monitors accountsChanged, chainChanged, disconnect with safe cleanup to prevent crashes
  - **Staged Workflows**: Separated mint/burn into explicit stages (ensureConnected → ensurePolygonNetwork → execute → confirm) with specific error messages for each failure point
  - **Status-Specific UI**: Different UI states for each MetaMask condition (installation prompts, network switch buttons, connection alerts)
  - **Error Resilience**: Guards prevent async calls during cleanup, safe disconnect preserves iframe/not-installed states
- **Dynamic Market Management**: An admin panel allows dynamic creation, validation, and removal of Polymarket-mirrored markets. A mirror worker automatically syncs odds from Polymarket.
- **Polymarket Adapter**: Fetches market data from Polymarket's Gamma API with a 10-minute cache, extracting YES probabilities for pricing.
- **Prediction Market Core**: Implements dynamic AMM pricing using the Constant Product Market Maker formula with a 2% spread. Orders are instantly filled with real-time share estimates.
- **Localization**: Full PT-BR localization for UI and backend messages.

### Feature Specifications
- **Authentication**: Standard email/password login/registration with unique usernames and protected routes. Admin quick access via password-only login.
- **KYC (Know Your Customer)**: Tier 1 identity verification integrated into onboarding flow. After username selection, users complete KYC form with full name, CPF (11 digits), birth date, phone (10-11 digits with area code), and complete Brazilian address (CEP, street, number, complement, district, city, state). Validation enforces correct formats (CPF digits only, state as 2 uppercase letters). Status transitions: not_started → pending (after submission) → approved/rejected (admin review). KYC data stored securely with tier-based verification levels (0-3).
- **Public Landing Page**: Displays available markets with real-time Polymarket odds. Features special grouped display for multi-candidate markets like "Eleição Presidencial Brasil 2026" showing **8 candidates** (Lula, Tarcísio, Haddad, Renan Santos, Ratinho Jr, Jair Bolsonaro, Michelle Bolsonaro, Eduardo Bolsonaro) with **authentic Polymarket price changes** synchronized every 5 minutes. Data includes daily/weekly price deltas and real-time volumes - no simulated historical charts.
- **Brazil Election Event Page** (`/brazil-election-2026`): Dedicated page matching Polymarket's event layout, featuring all 8 presidential candidates in a unified view. Includes summary bar with colored candidate dots, professional probability chart (top 4 candidates with solid lines, clean X-axis, dynamic Y-axis), and detailed candidate rows with Buy Yes/No buttons. Navigation flows from homepage card to event page to individual market detail pages.
  - **Chart Design**: Matches Polymarket's professional style with top 4 candidates as solid smooth curves, clean X-axis without date labels, dynamic Y-axis (rounded to nearest 10%), no background grid, and tooltip showing dates only on hover.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, discussion system, and integrated trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, real-time share estimate preview, cost, potential gain, and profit calculation. Includes balance validation - button disabled when user has insufficient balance with "Saldo insuficiente" message.
- **Portfolio**: Overview of total value, invested amount, P&L, active positions, wallet management (deposit/withdrawal requests), and transaction history. Users submit withdrawal requests with PIX key - admin processes transfers manually.
- **Profile Page**: User profile management including username, email, and account settings.
- **AI Assistant (Cachorro)**: Floating chat powered by GPT-5 (via Replit AI Integrations) offering context-aware responses and market recommendations.
- **Admin Panel**: Redesigned dark-themed interface for managing deposits, withdrawals, blockchain token operations (mint/burn via MetaMask), markets (manual and Polymarket mirrors), and users. Includes secure logout.

### System Design Choices
- **E2E Validation**: Extensive Playwright E2E tests cover critical user journeys.
- **Cache Invalidation**: TanStack Query is configured for efficient cache invalidation.
- **Mocked Features**: Pix and Crypto payments, along with manual market resolution, are mocked for the MVP.
- **Pricing Strategy**: Palpites.AI uses Polymarket's "spot price" (consensus market price) from the Gamma API, offering users ~10-15% better odds than Polymarket's execution price, with a transparent 2% platform fee.
- **Production Deployment Optimization**: Asynchronous mirror worker initialization and database seeding prevent deployment health check timeouts, ensuring rapid server startup.
- **Replit Autoscale Health Checks**: Optimized for fast responses with dedicated `/healthz` (no DB) and `/health` (with DB ping) endpoints.
- **Code Cleanup**: Repository cleaned of unused assets (attached_assets/, docs/), with all legacy routes and duplicated code removed. All 12 pages, components, and server files actively used and tested.

## External Dependencies
- **Database**: PostgreSQL (Supabase) in Session pooling mode
- **Blockchain**: Polygon Mainnet (via ethers.js v6)
- **AI**: OpenAI (via Replit AI Integrations for GPT-5)
- **Frontend Frameworks/Libraries**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend Libraries**: Node.js, Express, Drizzle ORM (postgres.js driver), Passport.js (pg.Pool for sessions), scrypt, ethers

## Recent Changes

### Nov 21, 2025 - Performance Optimizations & Critical UX Fixes
- **Deposit Validation Fix**: Removed mandatory walletAddress from PIX deposit requests - users no longer need MetaMask, admin wallet is used automatically
- **Shared Blockchain Config**: Created `shared/blockchain-config.ts` to centralize BRL3_TOKEN_ADDRESS and ADMIN_WALLET_ADDRESS constants
- **Schema Alignment**: Updated `insertPendingDepositSchema` with robust validation:
  - `amount`: Validates > 0, formats to 2 decimal places
  - `walletAddress`: Optional with empty string → undefined transform
  - `proofFilePath`: Required (aligned with route logic)
- **Mirror Worker Optimization**: Increased polling interval from 60s to 5 minutes (300000ms) to reduce API load
- **API Cache Extension**: Extended Polymarket Gamma API cache from 5min to 10min to minimize external requests
- **Logging Optimization**: Silenced verbose "candidate not mapped" messages to reduce log noise
- **Environment Fallback**: Admin wallet now uses fallback chain: validated.walletAddress → ADMIN_WALLET_ADDRESS env var → shared config constant
- **Critical UX Fixes** (Resolved blank admin page issue):
  - Removed auto-redirect from `home-page.tsx` - admins can view landing page
  - **Removed auto-redirect from `auth-page.tsx`** - users stay on current page after login (no forced redirect to /admin)
  - **Fixed missing Wallet icon import** in `admin-page.tsx` - resolved "Wallet is not defined" runtime error
  - Admin panel now fully functional - accessible via navbar, all components rendering correctly

### Nov 20, 2025 - Database Migration
- **Database Migration**: Migrated from Neon to Supabase PostgreSQL for improved reliability
- **Hybrid Database Architecture**: Implemented postgres.js for Drizzle ORM operations and separate pg.Pool for connect-pg-simple session store
- **Error Handling**: Added global unhandled promise rejection handler in App.tsx to prevent silent errors in production
- **Connection Mode**: Using Supabase Session pooling mode (port 5432) with `prepare: false` for compatibility