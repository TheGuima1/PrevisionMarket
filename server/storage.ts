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
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "id"> & { email: string }): Promise<User>;
  updateUserBalance(userId: string, balanceBrl: string, balanceUsdc: string): Promise<void>;
  updateUserUsername(userId: string, username: string): Promise<User>;

  // Market methods
  getMarkets(category?: string): Promise<Market[]>;
  getMarket(id: string): Promise<Market | undefined>;
  createMarket(market: InsertMarket): Promise<Market>;
  updateMarketPrices(marketId: string, yesPrice: string, noPrice: string, totalVolume: string, totalYesShares: string, totalNoShares: string): Promise<void>;
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

  // Order methods
  createOrder(userId: string, order: Omit<InsertOrder, "id" | "userId">): Promise<Order>;
  getOrdersByMarket(marketId: string): Promise<Order[]>;

  // Comment methods
  getCommentsByMarket(marketId: string): Promise<(Comment & { user: { username: string } })[]>;
  createComment(userId: string, comment: Omit<InsertComment, "id" | "userId">): Promise<Comment>;

  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(userId: string, transaction: Omit<InsertTransaction, "id" | "userId">): Promise<Transaction>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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

  async updateMarketPrices(
    marketId: string,
    yesPrice: string,
    noPrice: string,
    totalVolume: string,
    totalYesShares: string,
    totalNoShares: string
  ): Promise<void> {
    await db
      .update(markets)
      .set({
        yesPrice,
        noPrice,
        totalVolume,
        totalYesShares,
        totalNoShares,
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
    const [order] = await db.insert(orders).values({ ...insertOrder, userId }).returning();
    return order;
  }

  async getOrdersByMarket(marketId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.marketId, marketId))
      .orderBy(desc(orders.createdAt));
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
      user: { username: row.users!.username },
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
}

export const storage = new DatabaseStorage();
