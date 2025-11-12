import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMarketSchema, insertOrderSchema, insertMarketOrderSchema, insertCommentSchema, orders, markets, polymarketMarkets, polymarketSnapshots, positions, ammSnapshots } from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "./db";
import { users } from "@shared/schema";
import { sql, desc, and, gte, eq } from "drizzle-orm";
import * as AMM from "./amm-engine";
import { startPolymarketSnapshots } from "./polymarket-cron";
import { getSnapshot } from "./mirror/state";
import { startMirror } from "./mirror/worker";

// Error messages in Portuguese
const errorMessages = {
  UNAUTHORIZED: "Não autorizado. Faça login para continuar.",
  FORBIDDEN: "Acesso negado.",
  USERNAME_REQUIRED: "Username obrigatório. Por favor, escolha seu username primeiro.",
  MARKET_NOT_FOUND: "Mercado não encontrado.",
  MARKET_NOT_ACTIVE: "Mercado não está ativo.",
  INSUFFICIENT_BALANCE: "Saldo insuficiente. Deposite mais BRL3 para continuar.",
  FAILED_FETCH_MARKETS: "Falha ao buscar mercados. Tente novamente.",
  FAILED_FETCH_MARKET: "Falha ao buscar mercado. Tente novamente.",
  FAILED_FETCH_TRADES: "Falha ao buscar negociações recentes.",
  FAILED_PLACE_ORDER: "Falha ao executar aposta. Tente novamente.",
  NO_POSITION_FOUND: "Nenhuma posição encontrada para este mercado.",
  INSUFFICIENT_SHARES: "Shares insuficientes para vender.",
  FAILED_SELL_SHARES: "Falha ao vender shares. Tente novamente.",
  FAILED_FETCH_POSITIONS: "Falha ao buscar suas posições.",
  FAILED_FETCH_COMMENTS: "Falha ao buscar comentários.",
  FAILED_CREATE_COMMENT: "Falha ao criar comentário. Tente novamente.",
  INVALID_INPUT: "Dados inválidos. Verifique e tente novamente.",
  FAILED_DEPOSIT: "Falha ao processar depósito.",
  FAILED_WITHDRAWAL: "Falha ao processar saque.",
  FAILED_FETCH_TRANSACTIONS: "Falha ao buscar histórico de transações.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  FAILED_CREATE_ORDER: "Falha ao criar ordem.",
  FAILED_CANCEL_ORDER: "Falha ao cancelar ordem.",
  FAILED_FETCH_ORDERBOOK: "Falha ao buscar livro de ofertas.",
  FAILED_FETCH_ORDERS: "Falha ao buscar suas ordens.",
  FAILED_AI_REQUEST: "Falha ao processar pedido do assistente AI.",
  FAILED_CREATE_MARKET: "Falha ao criar mercado.",
  INVALID_OUTCOME: "Resultado inválido. Use: yes, no ou cancelled.",
  FAILED_RESOLVE_MARKET: "Falha ao resolver mercado.",
} as const;

// Initialize OpenAI for AI assistant
// Using Replit's AI Integrations service (no API key needed)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send(errorMessages.UNAUTHORIZED);
  }
  next();
}

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).send(errorMessages.FORBIDDEN);
  }
  next();
}

// Middleware to check if user has set their username
function ensureUsername(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send(errorMessages.UNAUTHORIZED);
  }
  if (!req.user?.username) {
    return res.status(403).send(errorMessages.USERNAME_REQUIRED);
  }
  next();
}

// Auto-seed database if empty OR reconcile market set to match configured slugs
async function autoSeedIfEmpty() {
  try {
    const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const marketCountResult = await db.select({ count: sql<number>`count(*)` }).from(markets);
    
    const numUsers = Number(userCountResult[0]?.count ?? 0);
    const numMarkets = Number(marketCountResult[0]?.count ?? 0);
    
    // Import metadata to know expected market set
    const { getConfiguredSlugs } = await import("./polymarket-metadata");
    const expectedSlugs = getConfiguredSlugs();
    
    // Check if we need to reconcile markets
    let needsReconciliation = false;
    if (numMarkets !== expectedSlugs.length) {
      needsReconciliation = true;
    } else {
      // Verify slugs match
      const existingMarkets = await db.select().from(markets);
      const existingSlugs = existingMarkets.map(m => m.polymarketSlug).filter(Boolean);
      const slugsMatch = expectedSlugs.every(s => existingSlugs.includes(s)) && 
                         existingSlugs.length === expectedSlugs.length;
      if (!slugsMatch) {
        needsReconciliation = true;
      }
    }
    
    // Run seed if DB is empty OR market set needs reconciliation
    if (numUsers === 0 || numMarkets === 0 || needsReconciliation) {
      if (needsReconciliation && numMarkets > 0) {
        console.log(`🔄 Market reconciliation needed (${numMarkets} markets, expected ${expectedSlugs.length}). Cleaning legacy markets...`);
        // Delete all markets and related data
        await db.delete(ammSnapshots);
        await db.delete(positions);
        await db.delete(orders);
        await db.delete(markets);
      }
      
      console.log(`🌱 Database needs seeding (${numUsers} users, ${numMarkets} markets). Running auto-seed...`);
      const { seed } = await import("./seed");
      await seed();
      console.log("✅ Auto-seed completed successfully!");
    } else {
      console.log(`✓ Database already has ${numUsers} users and ${numMarkets} markets matching configured slugs`);
    }
  } catch (error) {
    console.error("❌ Auto-seed failed:", error);
    // Don't crash the server if seed fails
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server FIRST (before any async operations)
  const server = createServer(app);

  // Setup authentication routes
  setupAuth(app);

  // Root health check endpoint for Replit Autoscale (MUST respond quickly with 200)
  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });

  // Detailed health check endpoint
  app.get("/health", async (_req, res) => {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);
      const marketCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      res.json({ 
        ok: true, 
        time: new Date().toISOString(),
        dbConnected: true,
        users: Number(marketCount[0]?.count ?? 0)
      });
    } catch (error) {
      res.status(500).json({ 
        ok: false, 
        error: "Database connection failed" 
      });
    }
  });

  // Auto-seed on first boot (production) - Run in background to not block server startup
  autoSeedIfEmpty().catch((error) => {
    console.error("❌ Auto-seed failed:", error);
    // Don't crash the server if seed fails
  });
  
  // Start Polymarket mirror worker to sync odds for Palpites.AI markets
  // Run asynchronously to avoid blocking server startup and health checks
  try {
    const { getConfiguredSlugs } = await import("./polymarket-metadata");
    const slugs = getConfiguredSlugs();
    
    if (slugs.length > 0) {
      console.log(`[Server] Starting mirror worker for ${slugs.length} Palpites.AI markets`);
      // Don't await - let it initialize in background to avoid deployment health check timeout
      startMirror().catch(err => {
        console.error('[Server] Mirror worker initialization failed:', err);
      });
    } else {
      console.log('[Server] No Palpites.AI markets configured');
    }
  } catch (err) {
    console.error('[Server] Failed to start mirror worker:', err);
  }
  
  // Legacy system (disabled by default)
  // Enable with ENABLE_POLYMARKET_CRON=true if historical snapshots are needed
  // The mirror worker handles live odds display (/api/polymarket/markets)
  if (process.env.ENABLE_POLYMARKET_CRON === 'true') {
    console.log('[Server] Starting legacy Polymarket cron (ENABLE_POLYMARKET_CRON=true)');
    startPolymarketSnapshots();
  } else {
    console.log('[Server] Legacy Polymarket cron disabled (set ENABLE_POLYMARKET_CRON=true to enable)');
  }

  // ===== MARKET ROUTES =====
  
  // GET /api/markets - List all markets (optionally filtered by category) - Public endpoint
  app.get("/api/markets", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const markets = await storage.getMarkets(category);
      res.json(markets);
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_FETCH_MARKETS);
    }
  });

  // GET /api/markets/:id - Get market details - Public endpoint
  app.get("/api/markets/:id", async (req, res) => {
    try {
      const market = await storage.getMarket(req.params.id);
      if (!market) {
        return res.status(404).send(errorMessages.MARKET_NOT_FOUND);
      }
      res.json(market);
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_FETCH_MARKET);
    }
  });

  // GET /api/markets/:id/history - Get AMM market historical odds (PUBLIC)
  app.get("/api/markets/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      const range = (req.query.range as string) || '1M';
      
      // Calculate time range
      const intervals: Record<string, number> = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        'ALL': 365,
      };
      const days = intervals[range] || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { ammSnapshots: ammSnapshotsTable } = await import("@shared/schema");
      const snapshots = await db.query.ammSnapshots.findMany({
        where: and(
          eq(ammSnapshotsTable.marketId, id),
          gte(ammSnapshotsTable.timestamp, since)
        ),
        orderBy: (snapshots, { asc }) => [asc(snapshots.timestamp)],
      });
      
      // Transform to match Polymarket history format for frontend compatibility
      const parsed = snapshots.map(s => ({
        timestamp: s.timestamp,
        outcomes: [
          {
            name: 'SIM',
            percent: parseFloat((parseFloat(s.probYes) * 100).toFixed(2)),
            raw: parseFloat(s.probYes),
          },
          {
            name: 'NÃO',
            percent: parseFloat((parseFloat(s.probNo) * 100).toFixed(2)),
            raw: parseFloat(s.probNo),
          },
        ],
      }));
      
      res.json(parsed);
    } catch (error) {
      console.error("Failed to fetch AMM history:", error);
      res.status(500).send("Falha ao buscar histórico do mercado.");
    }
  });

  // GET /api/recent-trades - Get recent trades across all markets (PUBLIC)
  app.get("/api/recent-trades", async (_req, res) => {
    try {
      const recentTrades = await storage.getRecentTrades(20);
      res.json(recentTrades);
    } catch (error) {
      console.error("Failed to fetch recent trades:", error);
      res.status(500).send(errorMessages.FAILED_FETCH_TRADES);
    }
  });

  // ===== POLYMARKET ROUTES =====
  
  // GET /api/polymarket/markets - List all Polymarket markets (PUBLIC)
  // Returns mirror snapshot with freeze-aware odds (probYes_display/probNo_display)
  app.get("/api/polymarket/markets", async (_req, res) => {
    try {
      // Feature flag gate: return empty if integration disabled
      if (process.env.ENABLE_POLYMARKET !== 'true') {
        return res.json([]);
      }

      // Get mirror snapshot (includes freeze logic)
      const snapshot = getSnapshot();
      
      // Convert to API format with decimal odds and percentages
      const marketsData = Object.values(snapshot.markets).map(m => ({
        slug: m.slug,
        title: m.title,
        volume: m.volumeUsd,
        frozen: m.frozen,
        freezeReason: m.freezeReason,
        outcomes: [
          {
            name: 'Yes',
            raw: m.probYes_display,
            percent: Number((m.probYes_display * 100).toFixed(2)),
            decimal: m.probYes_display > 0 ? Number((1 / m.probYes_display).toFixed(2)) : Infinity,
          },
          {
            name: 'No',
            raw: m.probNo_display,
            percent: Number((m.probNo_display * 100).toFixed(2)),
            decimal: m.probNo_display > 0 ? Number((1 / m.probNo_display).toFixed(2)) : Infinity,
          },
        ],
        lastUpdate: new Date(m.lastUpdate).toISOString(),
      }));
      
      res.json(marketsData);
    } catch (error) {
      console.error("Failed to fetch Polymarket markets:", error);
      res.status(500).send("Falha ao buscar mercados Polymarket.");
    }
  });
  
  // GET /api/polymarket/history/:slug - Get historical snapshots for a Polymarket market (PUBLIC)
  app.get("/api/polymarket/history/:slug", async (req, res) => {
    try {
      // Feature flag gate: return empty if integration disabled
      if (process.env.ENABLE_POLYMARKET !== 'true') {
        return res.json([]);
      }

      const { slug } = req.params;
      const range = (req.query.range as string) || '1M';
      
      // Calculate time range
      const intervals: Record<string, number> = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        'ALL': 365,
      };
      const days = intervals[range] || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const snapshots = await db.query.polymarketSnapshots.findMany({
        where: and(
          eq(polymarketSnapshots.slug, slug),
          gte(polymarketSnapshots.timestamp, since)
        ),
        orderBy: (snapshots, { asc }) => [asc(snapshots.timestamp)],
      });
      
      // Parse JSON outcomes
      const parsed = snapshots.map(s => ({
        timestamp: s.timestamp,
        outcomes: JSON.parse(s.outcomes),
      }));
      
      res.json(parsed);
    } catch (error) {
      console.error("Failed to fetch Polymarket history:", error);
      res.status(500).send("Falha ao buscar histórico Polymarket.");
    }
  });

  // ===== ORDER ROUTES =====
  
  // GET /api/orders - Get user's order history (requires auth)
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, userId),
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        limit: 100, // Last 100 orders
      });
      
      res.json(userOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).send("Erro ao buscar ordens.");
    }
  });
  
  // POST /api/orders - Place a buy market order using AMM with 2% spread (requires username)
  app.post("/api/orders", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Parse USDC amount to spend (not shares, since AMM determines shares)
      const schema = z.object({
        marketId: z.string(),
        type: z.enum(["yes", "no"]),
        usdcAmount: z.union([z.string(), z.number()]).transform(val => 
          typeof val === "string" ? parseFloat(val) : val
        ).pipe(z.number().positive("Amount must be greater than 0")),
      });
      
      const validated = schema.parse(req.body);
      
      const market = await storage.getMarket(validated.marketId);
      if (!market || market.status !== "active") {
        return res.status(400).send(errorMessages.MARKET_NOT_ACTIVE);
      }

      const usdcAmount = validated.usdcAmount;

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user || parseFloat(user.balanceBrl) < usdcAmount) {
        return res.status(400).send(errorMessages.INSUFFICIENT_BALANCE);
      }

      // Execute trade through AMM with 2% spread
      const ammState: AMM.AMMState = {
        yesReserve: parseFloat(market.yesReserve),
        noReserve: parseFloat(market.noReserve),
        k: parseFloat(market.k),
      };

      const tradeResult = AMM.buyShares(usdcAmount, validated.type, ammState, 200); // 200 bps = 2% spread

      // Calculate true avgPrice including spread (user paid usdcAmount for sharesBought shares)
      const trueAvgPrice = usdcAmount / tradeResult.sharesBought;
      const spreadFee = tradeResult.spreadFee || 0;

      // Create filled order with consistent accounting
      const [order] = await db.insert(orders).values({
        userId,
        marketId: validated.marketId,
        type: validated.type,
        action: "buy",
        shares: tradeResult.sharesBought.toFixed(2),
        price: trueAvgPrice.toFixed(4), // True price including spread
        status: "filled",
        filledShares: tradeResult.sharesBought.toFixed(2),
        totalCost: usdcAmount.toFixed(2), // What user actually paid
        feePaid: spreadFee.toFixed(6), // 2% spread fee
        makerFeeBps: 0,
        takerFeeBps: 200, // 2% = 200 bps
        isMaker: false,
        filledAt: new Date(),
      }).returning();

      // Update user balance
      const newBalance = (parseFloat(user.balanceBrl) - usdcAmount).toFixed(2);
      await storage.updateUserBalance(userId, newBalance, user.balanceUsdc);

      // Update position with true avg price (including spread)
      await storage.createOrUpdatePosition(
        userId,
        validated.marketId,
        validated.type === "yes" ? tradeResult.sharesBought : 0,
        validated.type === "no" ? tradeResult.sharesBought : 0,
        usdcAmount, // Total cost paid
        validated.type === "yes" ? trueAvgPrice : undefined, // True price including spread
        validated.type === "no" ? trueAvgPrice : undefined
      );

      // Update market AMM reserves and volume
      const newTotalVolume = (parseFloat(market.totalVolume) + usdcAmount).toFixed(2);
      
      await storage.updateMarketAMM(
        validated.marketId,
        tradeResult.newYesReserve.toFixed(2),
        tradeResult.newNoReserve.toFixed(2),
        tradeResult.newK.toFixed(4),
        newTotalVolume
      );

      // Create transaction record
      await storage.createTransaction(userId, {
        type: "trade_buy",
        amount: usdcAmount.toFixed(2),
        currency: "BRL",
        description: `Bought ${tradeResult.sharesBought.toFixed(2)} ${validated.type.toUpperCase()} shares in "${market.title}"`,
      });

      // Register platform fee (2%) as separate transaction
      if (spreadFee > 0) {
        await storage.createTransaction(userId, {
          type: "platform_fee",
          amount: spreadFee.toFixed(6),
          currency: "BRL",
          description: `Taxa Palpites.AI (${(200 / 100).toFixed(2)}%)`,
        });
      }

      res.json({ ...order, sharesBought: tradeResult.sharesBought });
    } catch (error: any) {
      console.error("Order error:", error);
      res.status(400).send(error.message || errorMessages.FAILED_PLACE_ORDER);
    }
  });

  // POST /api/orders/preview - Preview a trade without executing (dry-run)
  app.post("/api/orders/preview", async (req, res) => {
    try {
      const schema = z.object({
        marketId: z.string(),
        type: z.enum(["yes", "no"]),
        usdcAmount: z.union([z.string(), z.number()]).transform(val => 
          typeof val === "string" ? parseFloat(val) : val
        ).pipe(z.number().positive("Amount must be greater than 0")),
      });
      
      const validated = schema.parse(req.body);
      
      const market = await storage.getMarket(validated.marketId);
      if (!market) {
        return res.status(404).json({ error: "Mercado não encontrado" });
      }
      
      if (market.status !== "active") {
        return res.status(400).json({ error: "Mercado não está ativo" });
      }

      const stake = validated.usdcAmount;

      // Use unified AMM pricing service (shows Polymarket odds, charges 2% silently)
      const { calculateAMMPricing } = await import("./amm-pricing");
      
      const pricing = calculateAMMPricing({
        yesReserve: parseFloat(market.yesReserve),
        noReserve: parseFloat(market.noReserve),
        stake,
        outcome: validated.type,
        platformFeeBps: 200, // 2% platform fee
      });

      res.json({
        // What user sees (Polymarket odds without spread)
        displayProbYes: parseFloat((pricing.displayProbYes * 100).toFixed(2)),
        displayProbNo: parseFloat((pricing.displayProbNo * 100).toFixed(2)),
        displayOddsYes: parseFloat(pricing.displayOddsYes.toFixed(2)),
        displayOddsNo: parseFloat(pricing.displayOddsNo.toFixed(2)),
        
        // Trade execution details
        estimatedShares: parseFloat(pricing.netShares.toFixed(4)),
        totalCost: stake,
        platformFee: parseFloat(pricing.platformFee.toFixed(4)), // Silent 2% fee
        potentialPayout: parseFloat(pricing.potentialPayout.toFixed(2)),
        potentialProfit: parseFloat(pricing.potentialProfit.toFixed(2)),
      });
    } catch (error: any) {
      console.error("Preview error:", error);
      res.status(400).json({ error: error.message || "Falha ao simular aposta" });
    }
  });

  // Zod schema for sell order
  const sellOrderSchema = z.object({
    marketId: z.string(),
    type: z.enum(["yes", "no"]),
    shares: z.union([z.string(), z.number()]).transform(val => 
      typeof val === "string" ? parseFloat(val) : val
    ).refine(val => val > 0 && !isNaN(val), "Shares must be a positive number"),
  });

  // POST /api/orders/sell - Sell shares using AMM (requires username)
  app.post("/api/orders/sell", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate input with Zod
      const validated = sellOrderSchema.parse(req.body);
      const { marketId, type, shares } = validated;

      const market = await storage.getMarket(marketId);
      if (!market || market.status !== "active") {
        return res.status(400).send(errorMessages.MARKET_NOT_ACTIVE);
      }

      // Check user position
      const position = await storage.getPosition(userId, marketId);
      if (!position) {
        return res.status(400).send(errorMessages.NO_POSITION_FOUND);
      }

      const currentShares = type === "yes" 
        ? parseFloat(position.yesShares)
        : parseFloat(position.noShares);
      
      if (currentShares < shares) {
        return res.status(400).send(errorMessages.INSUFFICIENT_SHARES);
      }

      // Execute sell through AMM
      const ammState: AMM.AMMState = {
        yesReserve: parseFloat(market.yesReserve),
        noReserve: parseFloat(market.noReserve),
        k: parseFloat(market.k),
      };

      const sellResult = AMM.sellShares(shares, type, ammState);
      const proceeds = sellResult.avgPrice * shares;

      // Create sell order
      const [order] = await db.insert(orders).values({
        userId,
        marketId,
        type: type as "yes" | "no",
        action: "sell",
        shares: shares.toFixed(2),
        price: sellResult.avgPrice.toFixed(4),
        status: "filled",
        filledShares: shares.toFixed(2),
        totalCost: proceeds.toFixed(2),
        feePaid: "0.000000",
        makerFeeBps: 0,
        takerFeeBps: 0,
        isMaker: false,
        filledAt: new Date(),
      }).returning();

      // Update user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(500).send(errorMessages.USER_NOT_FOUND);
      }
      const newBalance = (parseFloat(user.balanceBrl) + proceeds).toFixed(2);
      await storage.updateUserBalance(userId, newBalance, user.balanceUsdc);

      // Update position (reduce shares)
      await storage.createOrUpdatePosition(
        userId,
        marketId,
        type === "yes" ? -shares : 0,
        type === "no" ? -shares : 0,
        -proceeds
      );

      // Update market AMM reserves and volume
      const newTotalVolume = (parseFloat(market.totalVolume) + proceeds).toFixed(2);
      
      await storage.updateMarketAMM(
        marketId,
        sellResult.newYesReserve.toFixed(2),
        sellResult.newNoReserve.toFixed(2),
        sellResult.newK.toFixed(4),
        newTotalVolume
      );

      // Create transaction record
      await storage.createTransaction(userId, {
        type: "trade_sell",
        amount: proceeds.toFixed(2),
        currency: "BRL",
        description: `Sold ${shares} ${type.toUpperCase()} shares in "${market.title}"`,
      });

      res.json(order);
    } catch (error: any) {
      console.error("Sell order error:", error);
      res.status(400).send(error.message || errorMessages.FAILED_SELL_SHARES);
    }
  });

  // ===== POSITION ROUTES =====
  
  // GET /api/positions - Get user's positions
  app.get("/api/positions", requireAuth, async (req, res) => {
    try {
      const positions = await storage.getPositions(req.user!.id);
      res.json(positions);
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_FETCH_POSITIONS);
    }
  });

  // ===== COMMENT ROUTES =====
  
  // GET /api/comments/:marketId - Get comments for a market
  app.get("/api/comments/:marketId", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getCommentsByMarket(req.params.marketId);
      res.json(comments);
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_FETCH_COMMENTS);
    }
  });

  // POST /api/comments - Create a comment (requires username)
  app.post("/api/comments", ensureUsername, async (req, res) => {
    try {
      const validated = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(req.user!.id, validated);
      res.json(comment);
    } catch (error: any) {
      res.status(400).send(error.message || errorMessages.FAILED_CREATE_COMMENT);
    }
  });

  // ===== WALLET ROUTES =====
  
  // Zod schema for wallet deposit
  const depositSchema = z.object({
    amount: z.union([z.string(), z.number()]).transform(val => 
      typeof val === "string" ? parseFloat(val) : val
    ).refine(val => val > 0 && !isNaN(val), "Amount must be a positive number"),
    currency: z.enum(["BRL", "USDC"]),
    type: z.enum(["deposit_pix", "deposit_usdc"]),
  });

  // POST /api/wallet/deposit - Deposit funds (MOCKED)
  app.post("/api/wallet/deposit", requireAuth, async (req, res) => {
    try {
      // Validate input with Zod
      const validated = depositSchema.parse(req.body);
      const { amount: depositAmount, currency, type } = validated;
      
      const user = req.user!;

      let newBalanceBrl = user.balanceBrl;
      let newBalanceUsdc = user.balanceUsdc;

      if (currency === "BRL") {
        newBalanceBrl = (parseFloat(user.balanceBrl) + depositAmount).toFixed(2);
      } else if (currency === "USDC") {
        newBalanceUsdc = (parseFloat(user.balanceUsdc) + depositAmount).toFixed(6);
      }

      await storage.updateUserBalance(user.id, newBalanceBrl, newBalanceUsdc);
      
      await storage.createTransaction(user.id, {
        type: type as any,
        amount: depositAmount.toString(),
        currency,
        description: `Deposited ${depositAmount} ${currency} (MOCKED)`,
      });

      res.json({ success: true });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).send(error.message || errorMessages.INVALID_INPUT);
      }
      res.status(500).send(errorMessages.FAILED_DEPOSIT);
    }
  });

  // Zod schema for wallet withdrawal
  const withdrawalSchema = z.object({
    amount: z.union([z.string(), z.number()]).transform(val => 
      typeof val === "string" ? parseFloat(val) : val
    ).refine(val => val > 0 && !isNaN(val), "Amount must be a positive number"),
    currency: z.enum(["BRL", "USDC"]),
    type: z.enum(["withdrawal_pix", "withdrawal_usdc"]),
  });

  // POST /api/wallet/withdraw - Withdraw funds (MOCKED)
  app.post("/api/wallet/withdraw", requireAuth, async (req, res) => {
    try {
      // Validate input with Zod
      const validated = withdrawalSchema.parse(req.body);
      const { amount: withdrawAmount, currency, type } = validated;
      
      const user = req.user!;

      let newBalanceBrl = user.balanceBrl;
      let newBalanceUsdc = user.balanceUsdc;

      if (currency === "BRL") {
        if (parseFloat(user.balanceBrl) < withdrawAmount) {
          return res.status(400).send("Insufficient balance");
        }
        newBalanceBrl = (parseFloat(user.balanceBrl) - withdrawAmount).toFixed(2);
      } else if (currency === "USDC") {
        if (parseFloat(user.balanceUsdc) < withdrawAmount) {
          return res.status(400).send("Insufficient balance");
        }
        newBalanceUsdc = (parseFloat(user.balanceUsdc) - withdrawAmount).toFixed(6);
      }

      await storage.updateUserBalance(user.id, newBalanceBrl, newBalanceUsdc);
      
      await storage.createTransaction(user.id, {
        type: type as any,
        amount: withdrawAmount.toString(),
        currency,
        description: `Withdrew ${withdrawAmount} ${currency} (MOCKED)`,
      });

      res.json({ success: true });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).send(error.message || errorMessages.INVALID_INPUT);
      }
      res.status(500).send(errorMessages.FAILED_WITHDRAWAL);
    }
  });

  // ===== TRANSACTION ROUTES =====
  
  // GET /api/transactions - Get user's transaction history
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_FETCH_TRANSACTIONS);
    }
  });

  // ===== CLOB (Central Limit Order Book) ROUTES =====
  
  // POST /api/clob/orders - Create a limit order
  app.post("/api/clob/orders", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validated = insertOrderSchema.parse(req.body);
      
      const market = await storage.getMarket(validated.marketId);
      if (!market || market.status !== "active") {
        return res.status(400).send("Market is not active");
      }

      const estimatedCost = validated.shares * validated.price;
      const estimatedFee = (estimatedCost * 10) / 10000;
      const totalRequired = estimatedCost + estimatedFee;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).send("User not found");
      }

      // Calculate reserved funds from open BUY orders
      const userOpenOrders = await storage.getUserOpenOrders(userId);
      const reservedFunds = userOpenOrders
        .filter(o => o.action === "buy")
        .reduce((sum, o) => {
          const remainingShares = parseFloat(o.shares) - parseFloat(o.filledShares);
          const reservedCost = remainingShares * parseFloat(o.price);
          return sum + reservedCost;
        }, 0);

      const availableBalance = parseFloat(user.balanceBrl) - reservedFunds;
      
      if (availableBalance < totalRequired) {
        return res.status(400).send(`Insufficient balance. Available: ${availableBalance.toFixed(2)}, Required: ${totalRequired.toFixed(2)}`);
      }

      const order = await storage.createOrder(userId, validated);

      res.json(order);
    } catch (error: any) {
      console.error("CLOB order error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", issues: error.issues });
      }
      res.status(400).send(error.message || errorMessages.FAILED_CREATE_ORDER);
    }
  });

  // DELETE /api/clob/orders/:orderId - Cancel an open order
  app.delete("/api/clob/orders/:orderId", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { orderId } = req.params;
      
      await storage.cancelOrder(orderId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).send(errorMessages.FAILED_CANCEL_ORDER);
    }
  });

  // GET /api/clob/orderbook/:marketId - Get order book for a market
  app.get("/api/clob/orderbook/:marketId", async (req, res) => {
    try {
      const { marketId } = req.params;
      const orderbook = await storage.getOrderBook(marketId);
      
      res.json(orderbook);
    } catch (error) {
      console.error("Order book error:", error);
      res.status(500).send(errorMessages.FAILED_FETCH_ORDERBOOK);
    }
  });

  // GET /api/clob/my-orders - Get my open orders
  app.get("/api/clob/my-orders", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      const myOrders = await storage.getUserOpenOrders(userId);
      
      res.json(myOrders);
    } catch (error) {
      console.error("My orders error:", error);
      res.status(500).send(errorMessages.FAILED_FETCH_ORDERS);
    }
  });

  // ===== AI ASSISTANT ROUTES =====
  
  // POST /api/ai/chat - Chat with AI assistant
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      
      const systemPrompt = `You are the MatrizPIX AI assistant, a friendly dog mascot helping users understand prediction markets.

Your role:
- Explain how MatrizPIX works (it's a prediction market platform where users trade shares in event outcomes)
- Interpret and convert odds between formats:
  * Decimal (e.g., 2.30 means if you bet 1 unit, you get 2.30 back if you win)
  * American (e.g., +160 means bet 100 to win 160; -160 means bet 160 to win 100)
  * Probability (e.g., 43.5% chance of outcome)
  Formula: Decimal = 1 / Probability; American = (Decimal-1)*100 if Decimal >= 2, else -100/(Decimal-1)
- Provide market sentiment and recommendations
- Be friendly, concise, and helpful
- Answer in Portuguese (Brazilian)
- Use simple, non-technical language`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_completion_tokens: 500,
      });

      res.json({ response: response.choices[0]?.message?.content || "Desculpe, não consegui processar sua pergunta." });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).send(errorMessages.FAILED_AI_REQUEST);
    }
  });

  // ===== ADMIN ROUTES =====
  
  // GET /api/admin/markets - Get all markets for admin
  app.get("/api/admin/markets", requireAdmin, async (req, res) => {
    try {
      const markets = await storage.getMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_FETCH_MARKETS);
    }
  });

  // POST /api/admin/markets - Create a new market with admin seed liquidity
  app.post("/api/admin/markets", requireAdmin, async (req, res) => {
    try {
      // Validate market data + seed liquidity
      const schema = insertMarketSchema.extend({
        seedLiquidity: z.union([z.string(), z.number()]).transform(val => 
          typeof val === "string" ? parseFloat(val) : val
        ).pipe(z.number().min(10, "Minimum seed liquidity is R$ 10")),
      });
      
      const validated = schema.parse(req.body);
      const seedAmount = validated.seedLiquidity;
      
      // Seed AMM with symmetric reserves
      const ammState = AMM.seedMarket(seedAmount);
      
      // Create market with seeded reserves
      const market = await db.insert(markets).values({
        title: validated.title,
        description: validated.description,
        category: validated.category,
        tags: validated.tags || [],
        resolutionSource: validated.resolutionSource,
        endDate: validated.endDate,
        yesReserve: ammState.yesReserve.toFixed(2),
        noReserve: ammState.noReserve.toFixed(2),
        k: ammState.k.toFixed(4),
        seedLiquidity: seedAmount.toFixed(2),
      }).returning();
      
      res.json(market[0]);
    } catch (error: any) {
      console.error("Admin market creation error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", issues: error.issues });
      }
      res.status(400).send(error.message || errorMessages.FAILED_CREATE_MARKET);
    }
  });

  // POST /api/admin/markets/:id/resolve - Resolve a market
  app.post("/api/admin/markets/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const { outcome } = req.body;
      const marketId = req.params.id;
      
      if (!["yes", "no", "cancelled"].includes(outcome)) {
        return res.status(400).send(errorMessages.INVALID_OUTCOME);
      }

      const market = await storage.getMarket(marketId);
      if (!market) {
        return res.status(404).send("Market not found");
      }

      // Resolve the market
      await storage.resolveMarket(marketId, outcome);

      // TODO: In a real implementation, we would liquidate all positions here
      // For MVP, positions remain but market shows as resolved

      res.json({ success: true });
    } catch (error) {
      res.status(500).send(errorMessages.FAILED_RESOLVE_MARKET);
    }
  });

  // Return the server instance created at the beginning
  return server;
}
