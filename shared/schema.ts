import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const marketCategoryEnum = pgEnum("market_category", [
  "politica",
  "economia",
  "cultura",
  "esportes",
  "ciencia",
]);

export const marketStatusEnum = pgEnum("market_status", [
  "active",
  "closed",
  "resolved",
  "cancelled",
]);

export const orderTypeEnum = pgEnum("order_type", ["yes", "no"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit_pix",
  "deposit_usdc",
  "withdrawal_pix",
  "withdrawal_usdc",
  "trade_buy",
  "trade_sell",
  "market_resolution",
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  balanceBrl: decimal("balance_brl", { precision: 12, scale: 2 }).notNull().default("0.00"),
  balanceUsdc: decimal("balance_usdc", { precision: 12, scale: 6 }).notNull().default("0.000000"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Markets table
export const markets = pgTable("markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: marketCategoryEnum("category").notNull(),
  status: marketStatusEnum("status").notNull().default("active"),
  resolutionSource: text("resolution_source"),
  endDate: timestamp("end_date").notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedOutcome: orderTypeEnum("resolved_outcome"),
  yesPrice: decimal("yes_price", { precision: 5, scale: 4 }).notNull().default("0.5000"), // Price in probability (0-1)
  noPrice: decimal("no_price", { precision: 5, scale: 4 }).notNull().default("0.5000"),
  totalVolume: decimal("total_volume", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalYesShares: decimal("total_yes_shares", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalNoShares: decimal("total_no_shares", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Positions table (user's current holdings in a market)
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  yesShares: decimal("yes_shares", { precision: 12, scale: 2 }).notNull().default("0.00"),
  noShares: decimal("no_shares", { precision: 12, scale: 2 }).notNull().default("0.00"),
  averageYesPrice: decimal("average_yes_price", { precision: 5, scale: 4 }),
  averageNoPrice: decimal("average_no_price", { precision: 5, scale: 4 }),
  totalInvested: decimal("total_invested", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders table (trade history)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  type: orderTypeEnum("type").notNull(),
  shares: decimal("shares", { precision: 12, scale: 2 }).notNull(),
  price: decimal("price", { precision: 5, scale: 4 }).notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Comments table (market discussions)
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions table (wallet activity)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 6 }).notNull(),
  currency: text("currency").notNull(), // 'BRL' or 'USDC'
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  positions: many(positions),
  orders: many(orders),
  comments: many(comments),
  transactions: many(transactions),
}));

export const marketsRelations = relations(markets, ({ many }) => ({
  positions: many(positions),
  orders: many(orders),
  comments: many(comments),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  user: one(users, {
    fields: [positions.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [positions.marketId],
    references: [markets.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [orders.marketId],
    references: [markets.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [comments.marketId],
    references: [markets.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertMarketSchema = createInsertSchema(markets).omit({
  id: true,
  createdAt: true,
  yesPrice: true,
  noPrice: true,
  totalVolume: true,
  totalYesShares: true,
  totalNoShares: true,
  resolvedAt: true,
  resolvedOutcome: true,
}).extend({
  status: z.enum(["active", "closed", "resolved", "cancelled"]).default("active"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  userId: true,
  price: true, // Calculated by backend
  totalCost: true, // Calculated by backend
}).extend({
  marketId: z.string(),
  type: z.enum(["yes", "no"]),
  shares: z.union([z.string(), z.number()]).transform(val => 
    typeof val === "string" ? parseFloat(val) : val
  ).pipe(z.number().positive("Shares must be a positive number")),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  upvotes: true,
  downvotes: true,
  userId: true,
}).extend({
  marketId: z.string(),
  content: z.string().min(1).max(5000),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  userId: true,
});

// Select types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type Position = typeof positions.$inferSelect;
