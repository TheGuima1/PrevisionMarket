// Seed script to populate database with demo data
import { db } from "./db";
import { users, markets, orders, positions } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import * as AMM from "./amm-engine";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seed() {
  console.log("Seeding database...");

  // Check if users already exist
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
  const existingDemo = await db.select().from(users).where(eq(users.username, "demo"));
  
  let admin, demo;
  
  if (existingAdmin.length === 0) {
    // Create admin user
    const adminPassword = await hashPassword("admin123");
    [admin] = await db.insert(users).values({
      username: "admin",
      email: "admin@matrizpix.com",
      password: adminPassword,
      balanceBrl: "10000.00",
      balanceUsdc: "10000.000000",
      isAdmin: true,
    }).returning();
    
    console.log("Created admin user:", admin.username);
  } else {
    admin = existingAdmin[0];
    console.log("Admin user already exists");
  }

  if (existingDemo.length === 0) {
    // Create demo user
    const demoPassword = await hashPassword("demo123");
    [demo] = await db.insert(users).values({
      username: "demo",
      email: "demo@matrizpix.com",
      password: demoPassword,
      balanceBrl: "5000.00",
      balanceUsdc: "5000.000000",
    }).returning();
    
    console.log("Created demo user:", demo.username);
  } else {
    demo = existingDemo[0];
    console.log("Demo user already exists");
  }

  // 6 fixed markets - AMM system with admin-seeded liquidity
  // Each market gets R$ 100 initial seed (50 YES + 50 NO reserves)
  const SEED_LIQUIDITY = 100; // R$ 100 per market
  
  const demoMarkets = [
    {
      title: "Lula será reeleito presidente em 2026?",
      description: "Mercado será resolvido como SIM se Luiz Inácio Lula da Silva vencer as eleições presidenciais de 2026 no Brasil. NÃO se outro candidato vencer.",
      category: "politics" as const,
      tags: ["Lula", "Brasil", "Eleições"],
      resolutionSource: "TSE - Tribunal Superior Eleitoral",
      endDate: new Date("2026-10-30T23:59:59Z"),
      polymarketSlug: "will-any-presidential-candidate-win-outright-in-the-first-round-of-the-brazil-election", // Espelha odds do Polymarket
    },
    {
      title: "Recessão nos EUA em 2025?",
      description: "Mercado será resolvido como SIM se os EUA entrarem em recessão técnica (2 trimestres consecutivos de crescimento negativo do PIB) em 2025. NÃO caso contrário.",
      category: "politics" as const,
      tags: ["USA", "Recession", "Economy"],
      resolutionSource: "US Bureau of Economic Analysis",
      endDate: new Date("2025-12-31T23:59:59Z"),
      polymarketSlug: "us-recession-in-2025", // Espelha odds do Polymarket
    },
    {
      title: "Fed aumentará juros em 2025?",
      description: "Mercado será resolvido como SIM se o Federal Reserve aumentar a taxa de juros em qualquer momento durante 2025. NÃO caso contrário.",
      category: "politics" as const,
      tags: ["Fed", "USA", "Juros"],
      resolutionSource: "Federal Reserve Official Announcements",
      endDate: new Date("2025-12-31T23:59:59Z"),
      polymarketSlug: "fed-rate-hike-in-2025", // Espelha odds do Polymarket
    },
    {
      title: "Fed fará corte emergencial em 2025?",
      description: "Mercado será resolvido como SIM se o Federal Reserve realizar um corte de emergência na taxa de juros fora das reuniões programadas em 2025. NÃO caso contrário.",
      category: "crypto" as const,
      tags: ["Fed", "Emergency", "Rate Cut"],
      resolutionSource: "Federal Reserve",
      endDate: new Date("2025-12-31T23:59:59Z"),
      polymarketSlug: "fed-emergency-rate-cut-in-2025", // Espelha odds do Polymarket
    },
    {
      title: "IA substituirá 50% dos empregos até 2030?",
      description: "Mercado será resolvido como SIM se estudos demonstrarem que IA substituiu pelo menos 50% dos empregos globais até 2030. NÃO caso contrário.",
      category: "tech" as const,
      tags: ["AI", "Jobs", "Technology"],
      resolutionSource: "World Economic Forum / ILO reports",
      endDate: new Date("2030-12-31T23:59:59Z"),
      // Sem polymarketSlug: mantém odds seeded 50/50
    },
    {
      title: "Brasil sediará Copa do Mundo 2030?",
      description: "Mercado será resolvido como SIM se Brasil for anunciado como país-sede (ou co-sede) da Copa do Mundo FIFA 2030. NÃO caso contrário.",
      category: "sports" as const,
      tags: ["Copa", "Brasil", "FIFA"],
      resolutionSource: "FIFA Official Announcement",
      endDate: new Date("2025-06-30T23:59:59Z"),
      // Sem polymarketSlug: mantém odds seeded 50/50
    },
  ];

  const createdMarkets = [];
  for (const market of demoMarkets) {
    // Seed each market with R$ 100 symmetric liquidity
    const ammState = AMM.seedMarket(SEED_LIQUIDITY);
    
    const [created] = await db.insert(markets).values({
      ...market,
      yesReserve: ammState.yesReserve.toFixed(2),
      noReserve: ammState.noReserve.toFixed(2),
      k: ammState.k.toFixed(4),
      seedLiquidity: SEED_LIQUIDITY.toFixed(2),
    }).returning();
    
    createdMarkets.push(created);
    console.log(`Created market with R$ ${SEED_LIQUIDITY} seed:`, created.title);
  }

  console.log("\nAll markets seeded with admin liquidity (50/50 reserves)");
  console.log("Traders can now execute trades immediately with 2% spread");

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
