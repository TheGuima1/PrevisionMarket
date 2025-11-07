// Seed script to populate database with demo data
import { db } from "./db";
import { users, markets, orders, positions } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const [admin] = await db.insert(users).values({
    username: "admin",
    email: "admin@matrizpix.com",
    password: adminPassword,
    balanceBrl: "10000.00",
    balanceUsdc: "10000.000000",
    isAdmin: true,
  }).returning();
  
  console.log("Created admin user:", admin.username);

  // Create demo user
  const demoPassword = await hashPassword("demo123");
  const [demo] = await db.insert(users).values({
    username: "demo",
    email: "demo@matrizpix.com",
    password: demoPassword,
    balanceBrl: "5000.00",
    balanceUsdc: "5000.000000",
  }).returning();
  
  console.log("Created demo user:", demo.username);

  // 6 fixed markets mirroring Polymarket (simplified MVP)
  const demoMarkets = [
    {
      title: "Lula será reeleito presidente em 2026?",
      description: "Mercado será resolvido como SIM se Luiz Inácio Lula da Silva vencer as eleições presidenciais de 2026 no Brasil. NÃO se outro candidato vencer.",
      category: "politics" as const,
      tags: ["Lula", "Brasil", "Eleições"],
      resolutionSource: "TSE - Tribunal Superior Eleitoral",
      endDate: new Date("2026-10-30T23:59:59Z"),
      yesPrice: "0.4500",
      noPrice: "0.5500",
    },
    {
      title: "US Government Shutdown durará até fevereiro?",
      description: "Mercado será resolvido como SIM se o governo dos EUA permanecer em shutdown até 1º de fevereiro de 2025. NÃO se reabrir antes.",
      category: "politics" as const,
      tags: ["USA", "Shutdown", "Government"],
      resolutionSource: "Official US Government sources",
      endDate: new Date("2025-02-01T23:59:59Z"),
      yesPrice: "0.3200",
      noPrice: "0.6800",
    },
    {
      title: "Trump será presidente dos EUA em 2025?",
      description: "Mercado será resolvido como SIM se Donald Trump assumir como presidente dos EUA em 2025. NÃO caso contrário.",
      category: "politics" as const,
      tags: ["Trump", "USA", "Elections"],
      resolutionSource: "Official US Presidential Inauguration",
      endDate: new Date("2025-01-31T23:59:59Z"),
      yesPrice: "0.9900",
      noPrice: "0.0100",
    },
    {
      title: "Bitcoin atingirá $100.000 em 2025?",
      description: "Mercado será resolvido como SIM se Bitcoin (BTC/USD) atingir $100.000 ou mais em qualquer momento durante 2025. NÃO caso contrário.",
      category: "crypto" as const,
      tags: ["Bitcoin", "BTC", "Crypto"],
      resolutionSource: "CoinMarketCap - BTC/USD price",
      endDate: new Date("2025-12-31T23:59:59Z"),
      yesPrice: "0.6800",
      noPrice: "0.3200",
    },
    {
      title: "IA substituirá 50% dos empregos até 2030?",
      description: "Mercado será resolvido como SIM se estudos demonstrarem que IA substituiu pelo menos 50% dos empregos globais até 2030. NÃO caso contrário.",
      category: "tech" as const,
      tags: ["AI", "Jobs", "Technology"],
      resolutionSource: "World Economic Forum / ILO reports",
      endDate: new Date("2030-12-31T23:59:59Z"),
      yesPrice: "0.1500",
      noPrice: "0.8500",
    },
    {
      title: "Brasil sediará Copa do Mundo 2030?",
      description: "Mercado será resolvido como SIM se Brasil for anunciado como país-sede (ou co-sede) da Copa do Mundo FIFA 2030. NÃO caso contrário.",
      category: "sports" as const,
      tags: ["Copa", "Brasil", "FIFA"],
      resolutionSource: "FIFA Official Announcement",
      endDate: new Date("2025-06-30T23:59:59Z"),
      yesPrice: "0.0800",
      noPrice: "0.9200",
    },
  ];

  const createdMarkets = [];
  for (const market of demoMarkets) {
    const [created] = await db.insert(markets).values(market).returning();
    createdMarkets.push(created);
    console.log("Created market:", created.title);
  }

  // Create seed trades with varied volumes for trending ranking
  console.log("\nCreating seed trades...");
  
  const tradesToCreate = [
    // #1 Lula 2026 - HIGHEST volume (Top 1 trending)
    { marketId: createdMarkets[0].id, userId: admin.id, type: "yes" as const, shares: "1500.00", totalCost: "675.00" },
    { marketId: createdMarkets[0].id, userId: demo.id, type: "no" as const, shares: "2000.00", totalCost: "1100.00" },
    
    // #2 Shutdown - HIGH volume (Top 2 trending)
    { marketId: createdMarkets[1].id, userId: admin.id, type: "no" as const, shares: "1200.00", totalCost: "816.00" },
    { marketId: createdMarkets[1].id, userId: demo.id, type: "yes" as const, shares: "800.00", totalCost: "256.00" },
    
    // #3 Trump 2025 - MEDIUM-HIGH volume (Top 3 trending)
    { marketId: createdMarkets[2].id, userId: admin.id, type: "yes" as const, shares: "5000.00", totalCost: "4950.00" },
    { marketId: createdMarkets[2].id, userId: demo.id, type: "no" as const, shares: "100.00", totalCost: "1.00" },
    
    // #4 Bitcoin $100k - MEDIUM volume (Top 4 trending)
    { marketId: createdMarkets[3].id, userId: admin.id, type: "yes" as const, shares: "900.00", totalCost: "612.00" },
    { marketId: createdMarkets[3].id, userId: demo.id, type: "no" as const, shares: "600.00", totalCost: "192.00" },
    
    // #5 IA Empregos - LOW volume (not trending)
    { marketId: createdMarkets[4].id, userId: demo.id, type: "no" as const, shares: "200.00", totalCost: "170.00" },
    
    // #6 Copa Brasil - VERY LOW volume (not trending)
    { marketId: createdMarkets[5].id, userId: admin.id, type: "no" as const, shares: "150.00", totalCost: "138.00" },
  ];

  // Create orders and update market volumes
  for (const trade of tradesToCreate) {
    await db.insert(orders).values({
      marketId: trade.marketId,
      userId: trade.userId,
      type: trade.type,
      action: "buy",
      status: "filled",
      shares: trade.shares,
      filledShares: trade.shares,
      price: (parseFloat(trade.totalCost) / parseFloat(trade.shares)).toFixed(4),
      totalCost: trade.totalCost,
    });
  }

  // Update each market's total volume and shares
  for (const market of createdMarkets) {
    const marketTrades = tradesToCreate.filter(t => t.marketId === market.id);
    
    const totalVolume = marketTrades.reduce((sum, t) => sum + parseFloat(t.totalCost), 0).toFixed(2);
    const totalYesShares = marketTrades
      .filter(t => t.type === "yes")
      .reduce((sum, t) => sum + parseFloat(t.shares), 0)
      .toFixed(2);
    const totalNoShares = marketTrades
      .filter(t => t.type === "no")
      .reduce((sum, t) => sum + parseFloat(t.shares), 0)
      .toFixed(2);

    await db.update(markets)
      .set({ 
        totalVolume,
        totalYesShares,
        totalNoShares,
      })
      .where(eq(markets.id, market.id));
    
    console.log(`Market "${market.title}": Volume R$ ${totalVolume}, YES ${totalYesShares}, NO ${totalNoShares}`);
  }

  // Create positions for users
  console.log("\nCreating user positions...");
  
  for (const market of createdMarkets) {
    const adminTrades = tradesToCreate.filter(t => t.marketId === market.id && t.userId === admin.id);
    const demoTrades = tradesToCreate.filter(t => t.marketId === market.id && t.userId === demo.id);
    
    if (adminTrades.length > 0) {
      const yesShares = adminTrades.filter(t => t.type === "yes").reduce((sum, t) => sum + parseFloat(t.shares), 0).toFixed(2);
      const noShares = adminTrades.filter(t => t.type === "no").reduce((sum, t) => sum + parseFloat(t.shares), 0).toFixed(2);
      const totalInvested = adminTrades.reduce((sum, t) => sum + parseFloat(t.totalCost), 0).toFixed(2);
      
      await db.insert(positions).values({
        userId: admin.id,
        marketId: market.id,
        yesShares,
        noShares,
        totalInvested,
      });
    }
    
    if (demoTrades.length > 0) {
      const yesShares = demoTrades.filter(t => t.type === "yes").reduce((sum, t) => sum + parseFloat(t.shares), 0).toFixed(2);
      const noShares = demoTrades.filter(t => t.type === "no").reduce((sum, t) => sum + parseFloat(t.shares), 0).toFixed(2);
      const totalInvested = demoTrades.reduce((sum, t) => sum + parseFloat(t.totalCost), 0).toFixed(2);
      
      await db.insert(positions).values({
        userId: demo.id,
        marketId: market.id,
        yesShares,
        noShares,
        totalInvested,
      });
    }
  }

  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: username='admin', password='admin123'");
  console.log("Demo: username='demo', password='demo123'");
}

// Only run directly if this file is executed (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
