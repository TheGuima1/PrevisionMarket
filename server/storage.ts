// Code based on javascript_database and javascript_auth_all_persistance blueprints
import {
  users,
  markets,
  positions,
  orders,
  comments,
  transactions,
  type User,
  type InsertUser,
  type Market,
  type InsertMarket,
  type Position,
  type Order,
  type InsertOrder,
  type Comment,
  type InsertComment,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface RecentTrade {
  id: string;
  marketTitle: string;
  username: string;
  type: "yes" | "no";
  filledShares: string;
  price: string;
  executedAt: Date;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "id"> & { email: string }): Promise<User>;
  updateUserBalance(userId: string, balanceBrl: string, balanceUsdc: string): Promise<void>;
  updateUserUsername(userId: string, username: string): Promise<User>;
  updateUserPassword(userId: string, password: string): Promise<void>;

  // Market methods
  getMarkets(category?: string): Promise<Market[]>;
  getMarket(id: string): Promise<Market | undefined>;
  createMarket(market: InsertMarket): Promise<Market>;
  updateMarketAMM(marketId: string, yesReserve: string, noReserve: string, k: string, totalVolume: string): Promise<void>;
  resolveMarket(marketId: string, outcome: "yes" | "no" | "cancelled"): Promise<void>;

  // Position methods
  getPositions(userId: string): Promise<(Position & { market: Market })[]>;
  getPosition(userId: string, marketId: string): Promise<Position | undefined>;
  createOrUpdatePosition(
    userId: string,
    marketId: string,
    yesSharesDelta: number,
    noSharesDelta: number,
    investedDelta: number,
    avgYesPrice?: number,
    avgNoPrice?: number
  ): Promise<void>;

  // Order methods (CLOB)
  createOrder(userId: string, order: Omit<InsertOrder, "id" | "userId">): Promise<Order>;
  getOrdersByMarket(marketId: string): Promise<Order[]>;
  getOpenOrders(marketId: string, type: "yes" | "no", action: "buy" | "sell"): Promise<Order[]>;
  getOrderBook(marketId: string): Promise<{ 
    bids: { price: string; totalShares: number; numOrders: number }[]; 
    asks: { price: string; totalShares: number; numOrders: number }[] 
  }>;
  cancelOrder(orderId: string, userId: string): Promise<void>;
  matchOrder(newOrder: Order): Promise<void>;

  // Comment methods
  getCommentsByMarket(marketId: string): Promise<(Comment & { user: { username: string } })[]>;
  createComment(userId: string, comment: Omit<InsertComment, "id" | "userId">): Promise<Comment>;

  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(userId: string, transaction: Omit<InsertTransaction, "id" | "userId">): Promise<Transaction>;

  // Recent trades method
  getRecentTrades(limit?: number): Promise<RecentTrade[]>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, "id"> & { email: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(userId: string, balanceBrl: string, balanceUsdc: string): Promise<void> {
    await db
      .update(users)
      .set({ balanceBrl, balanceUsdc })
      .where(eq(users.id, userId));
  }

  async updateUserUsername(userId: string, username: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await db
      .update(users)
      .set({ password })
      .where(eq(users.id, userId));
  }

  // Market methods
  async getMarkets(category?: string): Promise<Market[]> {
    if (category && category !== "all") {
      return await db
        .select()
        .from(markets)
        .where(eq(markets.category, category as any))
        .orderBy(desc(markets.createdAt));
    }
    return await db.select().from(markets).orderBy(desc(markets.createdAt));
  }

  async getMarket(id: string): Promise<Market | undefined> {
    const [market] = await db.select().from(markets).where(eq(markets.id, id));
    return market || undefined;
  }

  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const [market] = await db.insert(markets).values(insertMarket).returning();
    return market;
  }

  async updateMarketAMM(
    marketId: string,
    yesReserve: string,
    noReserve: string,
    k: string,
    totalVolume: string
  ): Promise<void> {
    await db
      .update(markets)
      .set({
        yesReserve,
        noReserve,
        k,
        totalVolume,
      })
      .where(eq(markets.id, marketId));
  }

  async resolveMarket(marketId: string, outcome: "yes" | "no" | "cancelled"): Promise<void> {
    await db
      .update(markets)
      .set({
        status: outcome === "cancelled" ? "cancelled" : "resolved",
        resolvedOutcome: outcome as any,
        resolvedAt: new Date(),
      })
      .where(eq(markets.id, marketId));
  }

  // Position methods
  async getPositions(userId: string): Promise<(Position & { market: Market })[]> {
    const result = await db
      .select()
      .from(positions)
      .leftJoin(markets, eq(positions.marketId, markets.id))
      .where(eq(positions.userId, userId));

    return result.map((row) => ({
      ...row.positions,
      market: row.markets!,
    }));
  }

  async getPosition(userId: string, marketId: string): Promise<Position | undefined> {
    const [position] = await db
      .select()
      .from(positions)
      .where(and(eq(positions.userId, userId), eq(positions.marketId, marketId)));
    return position || undefined;
  }

  async createOrUpdatePosition(
    userId: string,
    marketId: string,
    yesSharesDelta: number,
    noSharesDelta: number,
    investedDelta: number,
    avgYesPrice?: number,
    avgNoPrice?: number
  ): Promise<void> {
    const existing = await this.getPosition(userId, marketId);

    if (existing) {
      const newYesShares = parseFloat(existing.yesShares) + yesSharesDelta;
      const newNoShares = parseFloat(existing.noShares) + noSharesDelta;
      const newInvested = parseFloat(existing.totalInvested) + investedDelta;

      await db
        .update(positions)
        .set({
          yesShares: newYesShares.toFixed(2),
          noShares: newNoShares.toFixed(2),
          totalInvested: newInvested.toFixed(2),
          averageYesPrice: avgYesPrice ? avgYesPrice.toFixed(4) : existing.averageYesPrice,
          averageNoPrice: avgNoPrice ? avgNoPrice.toFixed(4) : existing.averageNoPrice,
          updatedAt: new Date(),
        })
        .where(and(eq(positions.userId, userId), eq(positions.marketId, marketId)));
    } else {
      await db.insert(positions).values({
        userId,
        marketId,
        yesShares: yesSharesDelta.toFixed(2),
        noShares: noSharesDelta.toFixed(2),
        totalInvested: investedDelta.toFixed(2),
        averageYesPrice: avgYesPrice ? avgYesPrice.toFixed(4) : null,
        averageNoPrice: avgNoPrice ? avgNoPrice.toFixed(4) : null,
      });
    }
  }

  // Order methods
  async createOrder(userId: string, insertOrder: Omit<InsertOrder, "id" | "userId">): Promise<Order> {
    const orderData: any = {
      ...insertOrder,
      userId,
      status: "open",
      filledShares: "0.00",
      totalCost: "0.00",
      feePaid: "0.000000",
      makerFeeBps: 0,
      takerFeeBps: 10,
    };
    
    if (typeof orderData.shares === 'number') {
      orderData.shares = orderData.shares.toFixed(2);
    }
    if (typeof orderData.price === 'number') {
      orderData.price = orderData.price.toFixed(4);
    }
    
    const [order] = await db.insert(orders).values(orderData).returning();
    
    await this.matchOrder(order);
    
    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order.id));
    
    return updatedOrder;
  }

  async getOrdersByMarket(marketId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.marketId, marketId))
      .orderBy(desc(orders.createdAt));
  }

  async getUserOpenOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        or(
          eq(orders.status, "open"),
          eq(orders.status, "partially_filled")
        )
      ))
      .orderBy(desc(orders.createdAt));
  }

  async getOpenOrders(marketId: string, type: "yes" | "no", action: "buy" | "sell"): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.marketId, marketId),
          eq(orders.type, type),
          eq(orders.action, action),
          or(eq(orders.status, "open"), eq(orders.status, "partially_filled"))
        )
      )
      .orderBy(
        action === "buy" ? desc(orders.price) : orders.price,
        orders.createdAt
      );
  }

  async getOrderBook(marketId: string): Promise<{ 
    bids: { price: string; totalShares: number; numOrders: number }[]; 
    asks: { price: string; totalShares: number; numOrders: number }[] 
  }> {
    const yesBids = await this.getOpenOrders(marketId, "yes", "buy");
    const yesAsks = await this.getOpenOrders(marketId, "yes", "sell");
    const noBids = await this.getOpenOrders(marketId, "no", "buy");
    const noAsks = await this.getOpenOrders(marketId, "no", "sell");

    const aggregateBids = (orders: Order[]) => {
      const grouped = new Map<string, { totalShares: number; numOrders: number }>();
      for (const order of orders) {
        const remainingShares = parseFloat(order.shares) - parseFloat(order.filledShares);
        if (remainingShares <= 0) continue;
        
        const existing = grouped.get(order.price);
        if (existing) {
          existing.totalShares += remainingShares;
          existing.numOrders += 1;
        } else {
          grouped.set(order.price, { totalShares: remainingShares, numOrders: 1 });
        }
      }
      return Array.from(grouped.entries())
        .map(([price, data]) => ({ price, ...data }))
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    };

    const aggregateAsks = (orders: Order[]) => {
      const grouped = new Map<string, { totalShares: number; numOrders: number }>();
      for (const order of orders) {
        const remainingShares = parseFloat(order.shares) - parseFloat(order.filledShares);
        if (remainingShares <= 0) continue;
        
        const existing = grouped.get(order.price);
        if (existing) {
          existing.totalShares += remainingShares;
          existing.numOrders += 1;
        } else {
          grouped.set(order.price, { totalShares: remainingShares, numOrders: 1 });
        }
      }
      return Array.from(grouped.entries())
        .map(([price, data]) => ({ price, ...data }))
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    };

    return {
      bids: aggregateBids([...yesBids, ...noBids]),
      asks: aggregateAsks([...yesAsks, ...noAsks]),
    };
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    await db
      .update(orders)
      .set({ 
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, "open")));
  }

  async matchOrder(newOrder: Order): Promise<void> {
    const oppositeAction = newOrder.action === "buy" ? "sell" : "buy";
    const oppositeOrders = await this.getOpenOrders(
      newOrder.marketId,
      newOrder.type,
      oppositeAction
    );

    let remainingShares = parseFloat(newOrder.shares) - parseFloat(newOrder.filledShares);
    let totalCost = parseFloat(newOrder.totalCost);
    let totalFeePaid = parseFloat(newOrder.feePaid);

    for (const matchOrder of oppositeOrders) {
      if (remainingShares <= 0) break;

      const matchPrice = parseFloat(matchOrder.price);
      const newOrderPrice = parseFloat(newOrder.price);

      const canMatch =
        (newOrder.action === "buy" && newOrderPrice >= matchPrice) ||
        (newOrder.action === "sell" && newOrderPrice <= matchPrice);

      if (!canMatch) continue;

      const matchRemainingShares = parseFloat(matchOrder.shares) - parseFloat(matchOrder.filledShares);
      const sharesToFill = Math.min(remainingShares, matchRemainingShares);
      const fillPrice = matchPrice;
      const fillCost = sharesToFill * fillPrice;

      const takerFeeBps = 10;
      const takerFee = (fillCost * takerFeeBps) / 10000;

      await db
        .update(orders)
        .set({
          filledShares: sql`${orders.filledShares} + ${sharesToFill}`,
          totalCost: sql`${orders.totalCost} + ${fillCost}`,
          status: matchRemainingShares === sharesToFill ? "filled" : "partially_filled",
          updatedAt: new Date(),
          filledAt: matchRemainingShares === sharesToFill ? new Date() : null,
        })
        .where(eq(orders.id, matchOrder.id));

      remainingShares -= sharesToFill;
      totalCost += fillCost;
      totalFeePaid += takerFee;

      const buyerUserId = newOrder.action === "buy" ? newOrder.userId : matchOrder.userId;
      const sellerUserId = newOrder.action === "sell" ? newOrder.userId : matchOrder.userId;

      const buyerSharesDelta = newOrder.type === "yes" ? sharesToFill : 0;
      const buyerNoSharesDelta = newOrder.type === "no" ? sharesToFill : 0;
      const sellerSharesDelta = newOrder.type === "yes" ? -sharesToFill : 0;
      const sellerNoSharesDelta = newOrder.type === "no" ? -sharesToFill : 0;

      await this.createOrUpdatePosition(
        buyerUserId,
        newOrder.marketId,
        buyerSharesDelta,
        buyerNoSharesDelta,
        fillCost + takerFee,
        fillPrice,
        undefined
      );

      await this.createOrUpdatePosition(
        sellerUserId,
        newOrder.marketId,
        sellerSharesDelta,
        sellerNoSharesDelta,
        -fillCost,
        undefined,
        fillPrice
      );

      // Note: With AMM system, prices are calculated from reserves, not updated here
    }

    await db
      .update(orders)
      .set({
        filledShares: (parseFloat(newOrder.shares) - remainingShares).toFixed(2),
        totalCost: totalCost.toFixed(2),
        feePaid: totalFeePaid.toFixed(6),
        status: remainingShares === 0 ? "filled" : remainingShares < parseFloat(newOrder.shares) ? "partially_filled" : "open",
        updatedAt: new Date(),
        filledAt: remainingShares === 0 ? new Date() : null,
        isMaker: false,
      })
      .where(eq(orders.id, newOrder.id));
  }

  // Comment methods
  async getCommentsByMarket(marketId: string): Promise<(Comment & { user: { username: string } })[]> {
    const result = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.marketId, marketId))
      .orderBy(desc(comments.createdAt));

    return result.map((row) => ({
      ...row.comments,
      user: { username: row.users!.username || "Anonymous" },
    }));
  }

  async createComment(userId: string, insertComment: Omit<InsertComment, "id" | "userId">): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ ...insertComment, userId })
      .returning();
    return comment;
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50);
  }

  async createTransaction(userId: string, insertTransaction: Omit<InsertTransaction, "id" | "userId">): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({ ...insertTransaction, userId })
      .returning();
    return transaction;
  }

  // Recent trades implementation
  async getRecentTrades(limit: number = 20): Promise<RecentTrade[]> {
    const result = await db
      .select({
        id: orders.id,
        marketTitle: markets.title,
        username: users.username,
        type: orders.type,
        filledShares: orders.filledShares,
        price: orders.price,
        filledAt: orders.filledAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(markets, eq(orders.marketId, markets.id))
      .where(eq(orders.status, "filled"))
      .orderBy(desc(orders.filledAt))
      .limit(limit);

    return result.map((row) => ({
      id: row.id,
      marketTitle: row.marketTitle,
      username: row.username || "Anônimo",
      type: row.type as "yes" | "no",
      filledShares: row.filledShares,
      price: row.price,
      executedAt: row.filledAt || row.createdAt,
    }));
  }
}

export const storage = new DatabaseStorage();
