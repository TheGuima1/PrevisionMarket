import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMarketSchema, insertOrderSchema, insertMarketOrderSchema, insertCommentSchema, orders } from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "./db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";

// Initialize OpenAI for AI assistant
// Using Replit's AI Integrations service (no API key needed)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).send("Forbidden");
  }
  next();
}

// Middleware to check if user has set their username
function ensureUsername(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  if (!req.user?.username) {
    return res.status(403).send("Username required - please set your username first");
  }
  next();
}

// Auto-seed database if empty (production safety)
async function autoSeedIfEmpty() {
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const count = Number(userCount[0]?.count ?? 0);
    
    if (count === 0) {
      console.log("🌱 Database is empty, running auto-seed...");
      const { seed } = await import("./seed");
      await seed();
      console.log("✅ Auto-seed completed successfully!");
    } else {
      console.log(`✓ Database already has ${count} users, skipping seed`);
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

  // Health check endpoint
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

  // Auto-seed on first boot (production)
  await autoSeedIfEmpty();

  // ===== MARKET ROUTES =====
  
  // GET /api/markets - List all markets (optionally filtered by category) - Public endpoint
  app.get("/api/markets", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const markets = await storage.getMarkets(category);
      res.json(markets);
    } catch (error) {
      res.status(500).send("Failed to fetch markets");
    }
  });

  // GET /api/markets/:id - Get market details - Public endpoint
  app.get("/api/markets/:id", async (req, res) => {
    try {
      const market = await storage.getMarket(req.params.id);
      if (!market) {
        return res.status(404).send("Market not found");
      }
      res.json(market);
    } catch (error) {
      res.status(500).send("Failed to fetch market");
    }
  });

  // GET /api/recent-trades - Get recent trades across all markets (PUBLIC)
  app.get("/api/recent-trades", async (_req, res) => {
    try {
      const recentTrades = await storage.getRecentTrades(20);
      res.json(recentTrades);
    } catch (error) {
      console.error("Failed to fetch recent trades:", error);
      res.status(500).send("Failed to fetch recent trades");
    }
  });

  // ===== ORDER ROUTES =====
  
  // POST /api/orders - Place a buy market order (requires username)
  app.post("/api/orders", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validated = insertMarketOrderSchema.parse(req.body);
      
      const market = await storage.getMarket(validated.marketId);
      if (!market || market.status !== "active") {
        return res.status(400).send("Market is not active");
      }

      // shares is now guaranteed to be a positive number by insertOrderSchema
      const shares = validated.shares;
      
      const price = validated.type === "yes" 
        ? parseFloat(market.yesPrice) 
        : parseFloat(market.noPrice);
      
      const totalCost = shares * price;

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user || parseFloat(user.balanceBrl) < totalCost) {
        return res.status(400).send("Insufficient balance");
      }

      // Create market order - instantly filled at current market price (MVP simplified, no CLOB matching)
      const [order] = await db.insert(orders).values({
        userId,
        marketId: validated.marketId,
        type: validated.type,
        action: "buy",
        shares: shares.toFixed(2),
        price: price.toFixed(4),
        status: "filled",
        filledShares: shares.toFixed(2),
        totalCost: totalCost.toFixed(2),
        feePaid: "0.000000",
        makerFeeBps: 0,
        takerFeeBps: 10,
        isMaker: false,
        filledAt: new Date(),
      }).returning();

      // Update user balance
      const newBalance = (parseFloat(user.balanceBrl) - totalCost).toFixed(2);
      await storage.updateUserBalance(userId, newBalance, user.balanceUsdc);

      // Update position
      await storage.createOrUpdatePosition(
        userId,
        validated.marketId,
        validated.type === "yes" ? shares : 0,
        validated.type === "no" ? shares : 0,
        totalCost,
        validated.type === "yes" ? price : undefined,
        validated.type === "no" ? price : undefined
      );

      // Update market statistics (volume only - prices are fixed)
      const newTotalVolume = (parseFloat(market.totalVolume) + totalCost).toFixed(2);
      const newTotalYesShares = validated.type === "yes"
        ? (parseFloat(market.totalYesShares) + shares).toFixed(2)
        : market.totalYesShares;
      const newTotalNoShares = validated.type === "no"
        ? (parseFloat(market.totalNoShares) + shares).toFixed(2)
        : market.totalNoShares;
      
      // Update volume/shares only - prices remain fixed (MVP simplified)
      await storage.updateMarketStats(
        validated.marketId,
        newTotalVolume,
        newTotalYesShares,
        newTotalNoShares
      );

      // Create transaction record
      await storage.createTransaction(userId, {
        type: "trade_buy",
        amount: totalCost.toFixed(2),
        currency: "BRL",
        description: `Bought ${shares} ${validated.type.toUpperCase()} shares in "${market.title}"`,
      });

      res.json(order);
    } catch (error: any) {
      console.error("Order error:", error);
      res.status(400).send(error.message || "Failed to place order");
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

  // POST /api/orders/sell - Sell shares from a position (requires username)
  app.post("/api/orders/sell", ensureUsername, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate input with Zod
      const validated = sellOrderSchema.parse(req.body);
      const { marketId, type, shares } = validated;

      const market = await storage.getMarket(marketId);
      if (!market || market.status !== "active") {
        return res.status(400).send("Market is not active");
      }

      // Check user position
      const position = await storage.getPosition(userId, marketId);
      if (!position) {
        return res.status(400).send("No position found");
      }

      const currentShares = type === "yes" 
        ? parseFloat(position.yesShares)
        : parseFloat(position.noShares);
      
      if (currentShares < shares) {
        return res.status(400).send("Insufficient shares to sell");
      }

      // Calculate proceeds
      const price = type === "yes" 
        ? parseFloat(market.yesPrice) 
        : parseFloat(market.noPrice);
      const proceeds = shares * price;

      // Create sell market order - instantly filled at current market price (MVP simplified)
      const [order] = await db.insert(orders).values({
        userId,
        marketId,
        type: type as "yes" | "no",
        action: "sell",
        shares: shares.toFixed(2),
        price: price.toFixed(4),
        status: "filled",
        filledShares: shares.toFixed(2),
        totalCost: proceeds.toFixed(2),
        feePaid: "0.000000",
        makerFeeBps: 0,
        takerFeeBps: 10,
        isMaker: false,
        filledAt: new Date(),
      }).returning();

      // Update user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(500).send("User not found");
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

      // Update market statistics (volume only - prices are fixed)
      const newTotalVolume = (parseFloat(market.totalVolume) + proceeds).toFixed(2);
      const newTotalYesShares = type === "yes"
        ? (parseFloat(market.totalYesShares) - shares).toFixed(2)
        : market.totalYesShares;
      const newTotalNoShares = type === "no"
        ? (parseFloat(market.totalNoShares) - shares).toFixed(2)
        : market.totalNoShares;
      
      // Update volume/shares only - prices remain fixed (MVP simplified)
      await storage.updateMarketStats(
        marketId,
        newTotalVolume,
        newTotalYesShares,
        newTotalNoShares
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
      res.status(400).send(error.message || "Failed to sell shares");
    }
  });

  // ===== POSITION ROUTES =====
  
  // GET /api/positions - Get user's positions
  app.get("/api/positions", requireAuth, async (req, res) => {
    try {
      const positions = await storage.getPositions(req.user!.id);
      res.json(positions);
    } catch (error) {
      res.status(500).send("Failed to fetch positions");
    }
  });

  // ===== COMMENT ROUTES =====
  
  // GET /api/comments/:marketId - Get comments for a market
  app.get("/api/comments/:marketId", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getCommentsByMarket(req.params.marketId);
      res.json(comments);
    } catch (error) {
      res.status(500).send("Failed to fetch comments");
    }
  });

  // POST /api/comments - Create a comment (requires username)
  app.post("/api/comments", ensureUsername, async (req, res) => {
    try {
      const validated = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(req.user!.id, validated);
      res.json(comment);
    } catch (error: any) {
      res.status(400).send(error.message || "Failed to create comment");
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
        return res.status(400).send(error.message || "Invalid input");
      }
      res.status(500).send("Failed to process deposit");
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
        return res.status(400).send(error.message || "Invalid input");
      }
      res.status(500).send("Failed to process withdrawal");
    }
  });

  // ===== TRANSACTION ROUTES =====
  
  // GET /api/transactions - Get user's transaction history
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).send("Failed to fetch transactions");
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
      res.status(400).send(error.message || "Failed to create order");
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
      res.status(500).send("Failed to cancel order");
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
      res.status(500).send("Failed to fetch order book");
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
      res.status(500).send("Failed to fetch orders");
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
      res.status(500).send("Failed to process AI request");
    }
  });

  // ===== ADMIN ROUTES =====
  
  // GET /api/admin/markets - Get all markets for admin
  app.get("/api/admin/markets", requireAdmin, async (req, res) => {
    try {
      const markets = await storage.getMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).send("Failed to fetch markets");
    }
  });

  // POST /api/admin/markets - Create a new market
  app.post("/api/admin/markets", requireAdmin, async (req, res) => {
    try {
      const validated = insertMarketSchema.parse(req.body);
      const market = await storage.createMarket(validated);
      res.json(market);
    } catch (error: any) {
      console.error("Admin market creation error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", issues: error.issues });
      }
      res.status(400).send(error.message || "Failed to create market");
    }
  });

  // POST /api/admin/markets/:id/resolve - Resolve a market
  app.post("/api/admin/markets/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const { outcome } = req.body;
      const marketId = req.params.id;
      
      if (!["yes", "no", "cancelled"].includes(outcome)) {
        return res.status(400).send("Invalid outcome");
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
      res.status(500).send("Failed to resolve market");
    }
  });

  // Return the server instance created at the beginning
  return server;
}
