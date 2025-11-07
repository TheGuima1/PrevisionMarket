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

  // 6 fixed markets - AMM system starts with ZERO liquidity
  // First trader will initialize reserves
  const demoMarkets = [
    {
      title: "Lula será reeleito presidente em 2026?",
      description: "Mercado será resolvido como SIM se Luiz Inácio Lula da Silva vencer as eleições presidenciais de 2026 no Brasil. NÃO se outro candidato vencer.",
      category: "politics" as const,
      tags: ["Lula", "Brasil", "Eleições"],
      resolutionSource: "TSE - Tribunal Superior Eleitoral",
      endDate: new Date("2026-10-30T23:59:59Z"),
      yesReserve: "0.00",
      noReserve: "0.00",
      k: "0.0000",
    },
    {
      title: "US Government Shutdown durará até fevereiro?",
      description: "Mercado será resolvido como SIM se o governo dos EUA permanecer em shutdown até 1º de fevereiro de 2025. NÃO se reabrir antes.",
      category: "politics" as const,
      tags: ["USA", "Shutdown", "Government"],
      resolutionSource: "Official US Government sources",
      endDate: new Date("2025-02-01T23:59:59Z"),
      yesReserve: "0.00",
      noReserve: "0.00",
      k: "0.0000",
    },
    {
      title: "Trump será presidente dos EUA em 2025?",
      description: "Mercado será resolvido como SIM se Donald Trump assumir como presidente dos EUA em 2025. NÃO caso contrário.",
      category: "politics" as const,
      tags: ["Trump", "USA", "Elections"],
      resolutionSource: "Official US Presidential Inauguration",
      endDate: new Date("2025-01-31T23:59:59Z"),
      yesReserve: "0.00",
      noReserve: "0.00",
      k: "0.0000",
    },
    {
      title: "Bitcoin atingirá $100.000 em 2025?",
      description: "Mercado será resolvido como SIM se Bitcoin (BTC/USD) atingir $100.000 ou mais em qualquer momento durante 2025. NÃO caso contrário.",
      category: "crypto" as const,
      tags: ["Bitcoin", "BTC", "Crypto"],
      resolutionSource: "CoinMarketCap - BTC/USD price",
      endDate: new Date("2025-12-31T23:59:59Z"),
      yesReserve: "0.00",
      noReserve: "0.00",
      k: "0.0000",
    },
    {
      title: "IA substituirá 50% dos empregos até 2030?",
      description: "Mercado será resolvido como SIM se estudos demonstrarem que IA substituiu pelo menos 50% dos empregos globais até 2030. NÃO caso contrário.",
      category: "tech" as const,
      tags: ["AI", "Jobs", "Technology"],
      resolutionSource: "World Economic Forum / ILO reports",
      endDate: new Date("2030-12-31T23:59:59Z"),
      yesReserve: "0.00",
      noReserve: "0.00",
      k: "0.0000",
    },
    {
      title: "Brasil sediará Copa do Mundo 2030?",
      description: "Mercado será resolvido como SIM se Brasil for anunciado como país-sede (ou co-sede) da Copa do Mundo FIFA 2030. NÃO caso contrário.",
      category: "sports" as const,
      tags: ["Copa", "Brasil", "FIFA"],
      resolutionSource: "FIFA Official Announcement",
      endDate: new Date("2025-06-30T23:59:59Z"),
      yesReserve: "0.00",
      noReserve: "0.00",
      k: "0.0000",
    },
  ];

  const createdMarkets = [];
  for (const market of demoMarkets) {
    const [created] = await db.insert(markets).values(market).returning();
    createdMarkets.push(created);
    console.log("Created market:", created.title);
  }

  // AMM system: Markets start with ZERO liquidity
  // Note: With AMM, we don't create seed trades initially
  // First user trade will initialize reserves
  console.log("\nMarkets created with zero initial liquidity (AMM system)");
  console.log("First trader will initialize market reserves");

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
