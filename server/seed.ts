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

  // PALPITES.AI MARKETS: Exatamente 4 mercados espelhando Polymarket
  // Número de mercados = número de slugs (sempre 1:1)
  // Metadados definidos em polymarket-metadata.ts (single source of truth)
  const { PALPITES_MARKETS } = await import("./polymarket-metadata");
  
  console.log(`\n🎯 Palpites.AI: Seeding ${PALPITES_MARKETS.length} markets from Polymarket\n`);

  const createdMarkets = [];
  const { fetchPolyBySlug } = await import("./mirror/adapter");
  
  for (const marketMeta of PALPITES_MARKETS) {
    try {
      // Fetch real Polymarket odds for this market
      const polyData = await fetchPolyBySlug(marketMeta.polymarketSlug);
      
      // Bootstrap AMM reserves from Polymarket probability
      const safeProb = Math.max(0.01, Math.min(0.99, polyData.probYes));
      const probNo = 1 - safeProb;
      const LIQUIDITY_SCALE = 10000;
      
      const yesReserve = Number((safeProb * LIQUIDITY_SCALE).toFixed(2));
      const noReserve = Number((probNo * LIQUIDITY_SCALE).toFixed(2));
      const k = Number((yesReserve * noReserve).toFixed(4));
      const seedLiquidity = Number((yesReserve + noReserve).toFixed(2));
      
      const [created] = await db.insert(markets).values({
        title: marketMeta.title,
        description: marketMeta.description,
        category: marketMeta.category,
        tags: marketMeta.tags,
        resolutionSource: marketMeta.resolutionSource,
        endDate: marketMeta.endDate,
        polymarketSlug: marketMeta.polymarketSlug,
        yesReserve: yesReserve.toFixed(2),
        noReserve: noReserve.toFixed(2),
        k: k.toFixed(4),
        seedLiquidity: seedLiquidity.toFixed(2),
      }).returning();
      
      createdMarkets.push(created);
      console.log(`✅ ${marketMeta.title}`);
      console.log(`   Polymarket odds: ${(polyData.probYes * 100).toFixed(2)}% SIM / ${(probNo * 100).toFixed(2)}% NÃO\n`);
    } catch (err) {
      console.error(`❌ Failed to seed ${marketMeta.title}:`, err instanceof Error ? err.message : err);
      console.error(`   Slug: ${marketMeta.polymarketSlug}\n`);
      throw err; // Stop seeding if any market fails
    }
  }

  console.log(`\n✅ All ${PALPITES_MARKETS.length} Palpites.AI markets seeded with live Polymarket odds`);
  console.log("   Mirror worker will keep odds synced every 60 seconds");
  console.log("   Users see pure Polymarket odds (2% spread applied on execution only)");

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
