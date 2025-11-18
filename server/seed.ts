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
      throw err; // Stop seeding if any market fails
    }
  }

  console.log(`\n✅ All ${PALPITES_MARKETS.length} Palpites.AI markets seeded with live Polymarket odds`);
  console.log("   Mirror worker will keep odds synced every 60 seconds");
  console.log("   Users see pure Polymarket odds (2% spread applied on execution only)");

  // Create Brazil Election 2026 Event (groups all 8 candidate markets)
  console.log(`\n🗳️  Creating Brazil Election 2026 event...`);
  const { events, eventMarkets } = await import("@shared/schema");
  
  const brazilElectionMarkets = createdMarkets.filter(m => 
    m.polymarketSlug?.startsWith('brazil-election-2026-')
  );

  if (brazilElectionMarkets.length > 0) {
    // Check if event already exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.slug, "brazil-election-2026"),
    });

    let event;
    if (existingEvent) {
      console.log(`✅ Event already exists: ${existingEvent.title}`);
      event = existingEvent;
    } else {
      // Create the event
      [event] = await db.insert(events).values({
        slug: "brazil-election-2026",
        title: "Eleição Presidencial Brasil 2026",
        description: "Quem vencerá as eleições presidenciais brasileiras de 2026? Mercados espelhados do Polymarket para os principais candidatos.",
        category: "politics",
        flagIcon: "🇧🇷",
        endDate: new Date("2026-10-04T23:59:59Z"),
        totalVolume: "0.00",
      }).returning();

      console.log(`✅ Event created: ${event.title}`);
    }

    // Link all Brazil Election markets to the event (if not already linked)
    const candidateOrder: Record<string, number> = {
      'brazil-election-2026-lula': 0,
      'brazil-election-2026-tarcisio': 1,
      'brazil-election-2026-haddad': 2,
      'brazil-election-2026-renan': 3,
      'brazil-election-2026-ratinho': 4,
      'brazil-election-2026-jair': 5,
      'brazil-election-2026-michelle': 6,
      'brazil-election-2026-eduardo': 7,
    };

    let linkedCount = 0;
    for (const market of brazilElectionMarkets) {
      // Check if already linked
      const existingLink = await db.query.eventMarkets.findFirst({
        where: sql`${eventMarkets.eventId} = ${event.id} AND ${eventMarkets.marketId} = ${market.id}`,
      });

      if (!existingLink) {
        const order = candidateOrder[market.polymarketSlug || ''] ?? 99;
        await db.insert(eventMarkets).values({
          eventId: event.id,
          marketId: market.id,
          order: order,
        });
        linkedCount++;
      }
    }

    if (linkedCount > 0) {
      console.log(`✅ Linked ${linkedCount} new candidate markets to event`);
    } else {
      console.log(`✅ All ${brazilElectionMarkets.length} candidates already linked`);
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
