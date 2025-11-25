// Seed script to populate database with demo data
import { db } from "./db";
import { users, markets, orders, positions, events, eventMarkets } from "@shared/schema";
import { sql, eq, and } from "drizzle-orm";
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
    
    // Update admin balance to ensure it has funds for testing
    await db.update(users)
      .set({ 
        balanceBrl: "10000.00",
        balanceUsdc: "10000.000000" 
      })
      .where(eq(users.id, admin.id));
    
    console.log("Updated admin balance to 10000 BRL / 10000 USDC");
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

  // PALPITES.AI MARKETS: Mercados espelhando Polymarket
  // Metadados definidos em polymarket-metadata.ts (single source of truth)
  const { PALPITES_MARKETS } = await import("./polymarket-metadata");
  
  console.log(`\n🎯 Palpites.AI: Seeding ${PALPITES_MARKETS.length} markets from Polymarket\n`);

  const createdMarkets = [];
  const { fetchPolyBySlug, fetchBrazilElectionMarkets } = await import("./mirror/adapter");
  
  // Fetch all Brazil election markets once (optimization)
  console.log(`\n🇧🇷 Fetching Brazil Presidential Election markets from Polymarket Events API...`);
  const brazilElectionMarkets = await fetchBrazilElectionMarkets();
  console.log(`   Found ${brazilElectionMarkets.length} candidate markets in the event\n`);
  
  for (const marketMeta of PALPITES_MARKETS) {
    try {
      // Check if market already exists
      const existing = await db.select().from(markets).where(eq(markets.polymarketSlug, marketMeta.polymarketSlug));
      if (existing.length > 0) {
        console.log(`⏭️  ${marketMeta.title} (already exists)`);
        createdMarkets.push(existing[0]);
        continue;
      }
      
      // Try to get odds from Brazil election event first (for presidential candidates)
      let polyData = brazilElectionMarkets.find(m => 
        m.slug.toLowerCase() === marketMeta.polymarketSlug.toLowerCase()
      );
      
      // If not found in event, try direct market fetch
      if (!polyData) {
        try {
          polyData = await fetchPolyBySlug(marketMeta.polymarketSlug);
        } catch {
          console.log(`⚠️  Could not fetch odds for ${marketMeta.title}, using 50%`);
          polyData = {
            slug: marketMeta.polymarketSlug,
            title: marketMeta.title,
            probYes: 0.5,
          };
        }
      }
      
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
        origin: "polymarket", // CRITICAL: Markets must have origin="polymarket" for mirror worker
        polymarketSlug: marketMeta.polymarketSlug,
        yesReserve: yesReserve.toFixed(2),
        noReserve: noReserve.toFixed(2),
        k: k.toFixed(4),
        seedLiquidity: seedLiquidity.toFixed(2),
        oneDayPriceChange: polyData.oneDayPriceChange?.toFixed(4),
        oneWeekPriceChange: polyData.oneWeekPriceChange?.toFixed(4),
      }).returning();
      
      createdMarkets.push(created);
      console.log(`✅ ${marketMeta.title}`);
      console.log(`   Polymarket odds: ${(polyData.probYes * 100).toFixed(2)}% SIM / ${(probNo * 100).toFixed(2)}% NÃO\n`);
    } catch (err) {
      console.error(`❌ Failed to seed ${marketMeta.title}:`, err instanceof Error ? err.message : err);
      console.error(`   Slug: ${marketMeta.polymarketSlug}\n`);
      // Don't throw - continue with other markets
    }
  }

  // Create Brazil Presidential Election event and link markets
  console.log(`\n🇧🇷 Creating Brazil Presidential Election event...`);
  
  const existingBrazilEvent = await db.select().from(events).where(eq(events.slug, "brazil-presidential-election"));
  
  let brazilEvent;
  if (existingBrazilEvent.length === 0) {
    [brazilEvent] = await db.insert(events).values({
      slug: "brazil-presidential-election",
      title: "Eleição Presidencial Brasil 2026",
      description: "Quem vencerá as eleições presidenciais brasileiras de 2026?",
      category: "politics",
      flagIcon: "🇧🇷",
      polymarketSlug: "brazil-presidential-election",
      endDate: new Date("2026-10-04T23:59:59Z"),
      totalVolume: "3311247.00",
    }).returning();
    console.log(`   ✅ Created event: ${brazilEvent.title}`);
  } else {
    brazilEvent = existingBrazilEvent[0];
    console.log(`   ⏭️  Event already exists: ${brazilEvent.title}`);
  }
  
  // Link all Brazil election markets to the event
  const brazilMarketSlugs = PALPITES_MARKETS
    .filter(m => m.polymarketSlug.includes("brazilian-presidential-election"))
    .map(m => m.polymarketSlug);
  
  for (const slug of brazilMarketSlugs) {
    const market = createdMarkets.find(m => m.polymarketSlug === slug);
    if (!market) continue;
    
    // Check if link exists using and() for multiple conditions
    const existingLink = await db.select().from(eventMarkets)
      .where(and(
        eq(eventMarkets.marketId, market.id),
        eq(eventMarkets.eventId, brazilEvent.id)
      ));
    
    if (existingLink.length === 0) {
      await db.insert(eventMarkets).values({
        eventId: brazilEvent.id,
        marketId: market.id,
      });
      console.log(`   Linked: ${market.title}`);
    }
  }

  console.log(`\n✅ All ${createdMarkets.length} Palpites.AI markets seeded with live Polymarket odds`);
  console.log("   Mirror worker will keep odds synced every 60 seconds");
  console.log("   Users see pure Polymarket odds (3% spread applied on execution only)");

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
