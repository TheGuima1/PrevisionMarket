# MatrizPIX - Plataforma Brasileira de Prediction Markets

## Overview
MatrizPIX is a prediction market platform, inspired by Polymarket, specifically designed for the Brazilian market. Its core purpose is to allow users to bet on future events using Pix and crypto (mocked for MVP). The project aims to provide a robust, user-friendly, and localized platform for prediction markets, with ambitions for real-time features, advanced trading tools, and decentralized integration in future phases. The MVP is complete, featuring decimal odds, full PT-BR localization, and a production-ready deployment.

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
- **Prediction Market Core**:
    - **Instant-Fill Market Orders (MVP)**: Simplified trading system where all market orders are instantly filled at current market price (yesPrice/noPrice) without CLOB matching. Orders immediately marked as status="filled" and appear in recent trades feed. Future: Full CLOB with limit orders and partial fills.
    - **Odds Calculation**: Automatic price calculation (AMM-like) with support for decimal odds as the primary display, alongside American and percentage probability.
    - **Localization**: Full PT-BR localization for all UI elements, categories, and messages.
    - **Recent Activity Feed**: Real-time display of recent filled orders with auto-refresh (5s polling), showing username, market, type (YES/NO), shares, BRL value, and relative timestamps.

### Feature Specifications
- **Authentication**: Email/password login/registration, unique username setup post-login, protected routes, and admin-specific routes.
- **Public Landing Page**: Polymarket-style homepage with public access, category pills (13 Polymarket categories + "All Markets"), tag-based filtering, and real-time market odds display.
- **Market Detail Page**: Comprehensive market information, multiple odds formats, Reddit-style discussion system, and integration with the trading panel.
- **Trading Panel**: Visual YES/NO toggle, quantity input, automatic calculation of cost, potential gain, and profit.
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