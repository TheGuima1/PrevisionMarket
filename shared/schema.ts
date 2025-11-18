import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums - Polymarket-style categories (complete list)
export const marketCategoryEnum = pgEnum("market_category", [
  "trending",
  "breaking",
  "new",
  "politics",
  "sports",
  "finance",
  "crypto",
  "geopolitics",
  "tech",
  "culture",
  "world",
  "economy",
  "elections",
]);

export const marketStatusEnum = pgEnum("market_status", [
  "active",
  "closed",
  "resolved",
  "cancelled",
]);

export const orderTypeEnum = pgEnum("order_type", ["yes", "no"]);

export const orderActionEnum = pgEnum("order_action", ["buy", "sell"]);

export const orderStatusEnum = pgEnum("order_status", [
  "open",
  "partially_filled",
  "filled",
  "cancelled",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit_pix",
  "deposit_usdc",
  "withdrawal_pix",
  "withdrawal_usdc",
  "trade_buy",
  "trade_sell",
  "market_resolution",
  "platform_fee",
]);

export const depositStatusEnum = pgEnum("deposit_status", [
  "pending",
  "approved",
  "rejected",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(), // Nullable - set after first login
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"), // Polygon wallet address for BRL3 tokens
  balanceBrl: decimal("balance_brl", { precision: 12, scale: 2 }).notNull().default("0.00"),
  balanceUsdc: decimal("balance_usdc", { precision: 12, scale: 6 }).notNull().default("0.000000"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Markets table - Hybrid AMM+Escrow system
export const markets = pgTable("markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: marketCategoryEnum("category").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  status: marketStatusEnum("status").notNull().default("active"),
  resolutionSource: text("resolution_source"),
  endDate: timestamp("end_date").notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedOutcome: orderTypeEnum("resolved_outcome"),
  // AMM Reserves (for price discovery only - NOT used for payouts)
  yesReserve: decimal("yes_reserve", { precision: 12, scale: 2 }).notNull().default("0.00"),
  noReserve: decimal("no_reserve", { precision: 12, scale: 2 }).notNull().default("0.00"),
  k: decimal("k", { precision: 24, scale: 4 }).notNull().default("0.0000"),
  seedLiquidity: decimal("seed_liquidity", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalVolume: decimal("total_volume", { precision: 12, scale: 2 }).notNull().default("0.00"),
  // Escrow System (Polymarket-style: locked collateral backs payouts)
  escrowLockedYes: decimal("escrow_locked_yes", { precision: 12, scale: 2 }).notNull().default("0.00"), // Collateral locked for YES shares
  escrowLockedNo: decimal("escrow_locked_no", { precision: 12, scale: 2 }).notNull().default("0.00"), // Collateral locked for NO shares
  totalSharesYes: decimal("total_shares_yes", { precision: 12, scale: 2 }).notNull().default("0.00"), // Total outstanding YES shares
  totalSharesNo: decimal("total_shares_no", { precision: 12, scale: 2 }).notNull().default("0.00"), // Total outstanding NO shares
  maxCollateralLimit: decimal("max_collateral_limit", { precision: 12, scale: 2 }).notNull().default("1000000.00"), // Max escrow per outcome
  // Origin: "local" (native AMM) or "polymarket" (mirrored from Polymarket)
  origin: text("origin").notNull().default("local"),
  polymarketSlug: text("polymarket_slug"), // If origin="polymarket", this is the Polymarket slug
  // Real Polymarket price changes (fetched from Gamma API)
  oneDayPriceChange: decimal("one_day_price_change", { precision: 8, scale: 4 }),
  oneWeekPriceChange: decimal("one_week_price_change", { precision: 8, scale: 4 }),
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

// Orders table (CLOB limit orders + trade history)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  type: orderTypeEnum("type").notNull(), // YES or NO
  action: orderActionEnum("action").notNull(), // BUY or SELL
  status: orderStatusEnum("status").notNull().default("open"), // OPEN, FILLED, CANCELLED, PARTIALLY_FILLED
  shares: decimal("shares", { precision: 12, scale: 2 }).notNull(), // Total shares in order
  filledShares: decimal("filled_shares", { precision: 12, scale: 2 }).notNull().default("0.00"), // Shares filled so far
  price: decimal("price", { precision: 5, scale: 4 }).notNull(), // Limit price (0-1 probability)
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull().default("0.00"), // Total cost (updated as filled)
  isMaker: boolean("is_maker").default(true), // Maker (true) or Taker (false) - for fee calculation
  makerFeeBps: integer("maker_fee_bps").default(0), // Maker fee in basis points (0-10)
  takerFeeBps: integer("taker_fee_bps").default(10), // Taker fee in basis points (5-10)
  feePaid: decimal("fee_paid", { precision: 12, scale: 6 }).notNull().default("0.000000"), // Total fee paid
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  filledAt: timestamp("filled_at"), // When order was fully filled
  cancelledAt: timestamp("cancelled_at"), // When order was cancelled
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

// Pending Deposits table (manual approval workflow)
export const pendingDeposits = pgTable("pending_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BRL"), // 'BRL' or 'USDC'
  proofFilePath: text("proof_file_path"), // Path to uploaded PIX proof PDF file
  status: depositStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved
  rejectionReason: text("rejection_reason"),
});

// Pending Withdrawals table (manual approval workflow)
export const pendingWithdrawals = pgTable("pending_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BRL"), // 'BRL' or 'USDC'
  pixKey: text("pix_key").notNull(), // PIX key provided by user (CPF, email, phone, random)
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  // EIP-2612 permit signature data (for gasless BRL token burns)
  permitDeadline: text("permit_deadline"), // BigInt stored as string
  permitV: integer("permit_v"),
  permitR: text("permit_r"),
  permitS: text("permit_s"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved
  rejectionReason: text("rejection_reason"),
});

// Polymarket Markets table (mirrored from Polymarket API)
export const polymarketMarkets = pgTable("polymarket_markets", {
  slug: text("slug").primaryKey(), // Polymarket slug (e.g., "presidential-election-2024")
  title: text("title").notNull(),
  outcomes: text("outcomes").notNull(), // JSON string: [{name, percent, raw}]
  volume: decimal("volume", { precision: 18, scale: 2 }),
  endsAt: timestamp("ends_at"),
  lastUpdate: timestamp("last_update").notNull().defaultNow(),
});

// Polymarket Snapshots table (historical data for charts)
export const polymarketSnapshots = pgTable("polymarket_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull(), // Polymarket slug - no foreign key to allow flexibility
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  outcomes: text("outcomes").notNull(), // JSON string: [{name, percent, raw}]
});

// AMM Snapshots table (historical data for AMM market charts)
export const ammSnapshots = pgTable("amm_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  yesReserve: decimal("yes_reserve", { precision: 12, scale: 2 }).notNull(),
  noReserve: decimal("no_reserve", { precision: 12, scale: 2 }).notNull(),
  probYes: decimal("prob_yes", { precision: 5, scale: 4 }).notNull(), // Probability 0.0000-1.0000
  probNo: decimal("prob_no", { precision: 5, scale: 4 }).notNull(),
});

// Events table (groups related markets - e.g., Brazil Presidential Election 2026)
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // URL slug (e.g., "brazil-election-2026")
  title: text("title").notNull(), // Display title (e.g., "Eleição Presidencial Brasil 2026")
  description: text("description").notNull(),
  category: marketCategoryEnum("category").notNull(),
  flagIcon: text("flag_icon"), // Icon name or asset path
  endDate: timestamp("end_date").notNull(),
  totalVolume: decimal("total_volume", { precision: 18, scale: 2 }).notNull().default("0.00"), // Aggregated from child markets
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Event Markets join table (links events to their alternative markets)
export const eventMarkets = pgTable("event_markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  order: integer("order").notNull().default(0), // Display order in vertical alternatives list
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  positions: many(positions),
  orders: many(orders),
  comments: many(comments),
  transactions: many(transactions),
  pendingDeposits: many(pendingDeposits),
  pendingWithdrawals: many(pendingWithdrawals),
}));

export const marketsRelations = relations(markets, ({ many }) => ({
  positions: many(positions),
  orders: many(orders),
  comments: many(comments),
  ammSnapshots: many(ammSnapshots),
  eventMarkets: many(eventMarkets),
}));

export const ammSnapshotsRelations = relations(ammSnapshots, ({ one }) => ({
  market: one(markets, {
    fields: [ammSnapshots.marketId],
    references: [markets.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventMarkets: many(eventMarkets),
}));

export const eventMarketsRelations = relations(eventMarkets, ({ one }) => ({
  event: one(events, {
    fields: [eventMarkets.eventId],
    references: [events.id],
  }),
  market: one(markets, {
    fields: [eventMarkets.marketId],
    references: [markets.id],
  }),
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

export const pendingDepositsRelations = relations(pendingDeposits, ({ one }) => ({
  user: one(users, {
    fields: [pendingDeposits.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [pendingDeposits.approvedBy],
    references: [users.id],
  }),
}));

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const setUsernameSchema = z.object({
  username: z.string()
    .min(3, "Username deve ter no mínimo 3 caracteres")
    .max(20, "Username deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, números e underscores"),
});

// Insert schemas (for internal use)
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertMarketSchema = createInsertSchema(markets).omit({
  id: true,
  createdAt: true,
  yesReserve: true,
  noReserve: true,
  k: true,
  totalVolume: true,
  resolvedAt: true,
  resolvedOutcome: true,
}).extend({
  status: z.enum(["active", "closed", "resolved", "cancelled"]).default("active"),
  endDate: z.union([z.string(), z.date()]).transform(val => 
    typeof val === "string" ? new Date(val) : val
  ),
});

// CLOB Limit Order schema (for creating new limit orders)
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  filledAt: true,
  cancelledAt: true,
  userId: true,
  totalCost: true,
  filledShares: true,
  feePaid: true,
  isMaker: true,
  makerFeeBps: true,
  takerFeeBps: true,
  status: true,
}).extend({
  marketId: z.string(),
  type: z.enum(["yes", "no"]),
  action: z.enum(["buy", "sell"]),
  shares: z.union([z.string(), z.number()]).transform(val => 
    typeof val === "string" ? parseFloat(val) : val
  ).pipe(z.number().positive("Shares must be greater than 0")),
  price: z.union([z.string(), z.number()]).transform(val => 
    typeof val === "string" ? parseFloat(val) : val
  ).pipe(z.number().min(0.01, "Price must be at least 0.01").max(0.99, "Price must be at most 0.99")),
});

// Simplified Market Order schema (MVP - no limit orders, auto price from market)
export const insertMarketOrderSchema = z.object({
  marketId: z.string(),
  type: z.enum(["yes", "no"]),
  shares: z.union([z.string(), z.number()]).transform(val => 
    typeof val === "string" ? parseFloat(val) : val
  ).pipe(z.number().positive("Shares must be greater than 0")),
});

// Cancel order schema
export const cancelOrderSchema = z.object({
  orderId: z.string(),
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

export const insertPendingDepositSchema = createInsertSchema(pendingDeposits).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  rejectedAt: true,
  approvedBy: true,
  status: true,
  userId: true,
}).extend({
  amount: z.union([z.string(), z.number()])
    .transform(val => typeof val === "string" ? val : val.toFixed(2)),
  currency: z.enum(["BRL", "USDC"]).default("BRL"),
  proofFileUrl: z.string().url().optional(),
});

export const insertPendingWithdrawalSchema = createInsertSchema(pendingWithdrawals).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  rejectedAt: true,
  approvedBy: true,
  status: true,
  userId: true,
}).extend({
  amount: z.union([z.string(), z.number()])
    .transform(val => typeof val === "string" ? val : val.toFixed(2)),
  currency: z.enum(["BRL", "USDC"]).default("BRL"),
  pixKey: z.string().min(1, "Chave PIX obrigatória"),
  permitDeadline: z.string().optional(),
  permitV: z.number().optional(),
  permitR: z.string().optional(),
  permitS: z.string().optional(),
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

export type InsertPendingDeposit = z.infer<typeof insertPendingDepositSchema>;
export type PendingDeposit = typeof pendingDeposits.$inferSelect;

export type InsertPendingWithdrawal = z.infer<typeof insertPendingWithdrawalSchema>;
export type PendingWithdrawal = typeof pendingWithdrawals.$inferSelect;

export type Position = typeof positions.$inferSelect;

// Polymarket types
export type PolymarketMarket = typeof polymarketMarkets.$inferSelect;
export type PolymarketSnapshot = typeof polymarketSnapshots.$inferSelect;

// Event types
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  totalVolume: true,
}).extend({
  endDate: z.union([z.string(), z.date()]).transform(val => 
    typeof val === "string" ? new Date(val) : val
  ),
});

export const insertEventMarketSchema = createInsertSchema(eventMarkets).omit({
  id: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertEventMarket = z.infer<typeof insertEventMarketSchema>;
export type EventMarket = typeof eventMarkets.$inferSelect;
