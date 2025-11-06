# MatrizPIX Design Guidelines

## Design Approach
**Reference-Based Strategy**: Drawing inspiration from Polymarket's clean trading interface, Brazilian fintech aesthetics (Nubank, PicPay), and modern prediction markets. The design balances financial professionalism with Brazilian warmth and social engagement.

## Core Design Principles
1. **Clarity First**: Financial data and odds must be immediately readable
2. **Trust & Transparency**: Clear pricing, honest probability displays, visible market activity
3. **Brazilian Identity**: Warm, approachable yet professional - not sterile corporate
4. **Social Trading**: Community discussion integrated naturally into trading flow

---

## Typography

**Font System**:
- Primary: Inter (Google Fonts) - clean, modern, excellent for data
- Accent: Outfit (Google Fonts) - friendly, approachable for headings and AI assistant

**Hierarchy**:
- Hero Headlines: text-5xl to text-6xl, font-bold (Outfit)
- Market Titles: text-2xl, font-semibold (Inter)
- Odds Display: text-3xl to text-4xl, font-bold, tabular-nums (Inter)
- Body Text: text-base, font-normal (Inter)
- Small Data: text-sm, font-medium for stats and metadata
- AI Assistant: text-lg, font-medium (Outfit) - conversational tone

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, and 12** consistently
- Tight spacing: p-2, gap-2 (within cards, between small elements)
- Standard spacing: p-4, gap-4 (card padding, form fields)
- Section spacing: p-6, gap-6 (between major sections)
- Large spacing: p-12, py-12 (page sections, hero areas)

**Grid System**:
- Desktop: 3-column market grids (grid-cols-3)
- Tablet: 2-column (md:grid-cols-2)
- Mobile: Single column (grid-cols-1)
- Max container width: max-w-7xl for content areas

---

## Component Library

### Navigation
- **Top Navigation Bar**: Sticky, full-width, height h-16
  - Logo left, main nav center (Markets, Portfolio, Leaderboard, Blog)
  - User menu + wallet balance right
  - Search bar with market autocomplete
  - AI assistant toggle (dog icon) accessible from any page

### Market Cards
- **Compact Card** (grid view):
  - Market title, category badge, current odds prominent
  - Mini volume indicator and participant count
  - Quick YES/NO action buttons
  - Hover state shows more details
  
- **Expanded Card** (detail view):
  - Full market description and resolution criteria
  - Order book preview (top 5 bids/asks)
  - Three-format odds display toggle (Decimal/American/Percentage)
  - Chart showing probability over time
  - Volume, liquidity, and activity metrics

### Trading Interface
- **Order Entry Panel**:
  - Large YES/NO toggle buttons (pill-style)
  - Amount input with balance display
  - Calculated payout shown prominently
  - Order type selector (Market/Limit)
  - Confirm button with clear final odds
  
- **Position Display**:
  - Table showing active positions
  - Current value, P&L with percentage change
  - Quick sell/close actions

### AI Assistant (Dog Mascot)
- **Floating Widget**: Bottom-right corner, expandable
- **Expanded View**: 
  - Chat interface with friendly dog avatar
  - Quick action buttons: "Explain Odds", "Market Sentiment", "Recommend Markets", "How It Works"
  - Context-aware responses based on current page
  - Markdown-style formatting for explanations

### Discussion/Blog Pages
- **Per-Market Discussion**:
  - Reddit-style threaded comments
  - User avatars with username and reputation badges
  - Upvote/downvote system
  - Filter by Top/New/Controversial
  - Rich text editor for posts (bold, italic, links)

### Authentication
- **Login/Signup Modal**:
  - Clean center-screen modal
  - Email/password fields with clear validation
  - Username selection step with uniqueness check
  - Progressive disclosure (don't overwhelm)

### Admin Dashboard
- **Market Creation Form**:
  - Multi-step wizard: Category → Question → Resolution Source → End Date
  - Preview of how market will appear
  - Bulk market upload option
  
- **Resolution Panel**:
  - List of pending markets awaiting resolution
  - Evidence/source verification section
  - One-click resolve with YES/NO/INVALID options

---

## Specialized Patterns

### Odds Display Strategy
Create a unified component that toggles between three formats:
- **Decimal** (2.30) - Default for Brazilian users, green indicator
- **American** (+160) - Toggle option, blue indicator  
- **Probability** (43.5%) - Toggle option, purple indicator

All three always visible on detail pages, selectable default in settings.

### Market Categories
Use distinct badge styles per category:
- **Política**: rounded-full badge, accent styling
- **Economia**: square badge with icon
- **Cultura**: rounded badge, creative styling
- **Esportes**: pill badge with team colors when applicable
- **Ciência**: badge with subtle border

### Wallet & Balance Display
- Prominent balance shown in navbar (BRL/USDC toggle)
- Deposit/Withdraw buttons always accessible
- Transaction history modal with Pix/Crypto tabs (mock indicators)
- Clear "This is a demo" badge during MVP phase

---

## Key Page Layouts

### Homepage/Dashboard
- Hero section: Large headline "Aposte no Futuro do Brasil" with platform explanation, no huge hero image
- Market categories as horizontal tabs/pills below hero
- Featured markets grid (3 columns desktop, trending markets)
- Leaderboard preview sidebar
- AI assistant introduction card

### Market Detail Page
- Two-column layout: Market info left (60%), Trading panel right (40%)
- Probability chart full-width above fold
- Discussion section below chart (Reddit-style)
- Related markets sidebar

### Portfolio Page
- Summary cards: Total Value, P&L Today, Win Rate
- Active positions table with filters
- Transaction history timeline
- Performance chart over time

### Blog/Discussion Hub
- Category filters across top
- Hot discussions grid view
- Trending topics sidebar
- "Start Discussion" prominent button

---

## Responsive Strategy
- Desktop: Multi-column layouts, sidebars, expanded views
- Tablet: Reduce to 2 columns, collapsible sidebars
- Mobile: Single column stack, bottom navigation, swipeable cards

---

## Accessibility
- High contrast for financial data (odds, prices, P&L)
- ARIA labels on all trading actions
- Keyboard shortcuts for quick trading (documented in help)
- Screen reader friendly order confirmations
- Consistent focus states across interactive elements

---

## Images
**No large hero image required** - this is a data-heavy trading platform. Focus on:
- User avatars (discussions)
- Category icons (custom icon set)
- AI assistant mascot (friendly dog illustration)
- Empty states with illustrations (no active markets, no positions)
- Market thumbnails for blog posts only