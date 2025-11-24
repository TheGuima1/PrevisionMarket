import { db } from "./db";
import { markets } from "../shared/schema";
import { eq } from "drizzle-orm";

const SPOTIFY_ARTISTS = [
  { name: "Bad Bunny", prob: 0.45 },
  { name: "Taylor Swift", prob: 0.30 },
  { name: "Kendrick Lamar", prob: 0.12 },
  { name: "Drake", prob: 0.05 },
  { name: "The Weeknd", prob: 0.03 },
  { name: "Ariana Grande", prob: 0.02 },
  { name: "Ed Sheeran", prob: 0.015 },
  { name: "Billie Eilish", prob: 0.01 },
];

async function seedSpotifyEvent() {
  console.log("🎵 Seeding Top Spotify Artist 2025 event...");

  const EVENT_TAG = "Top Spotify Artist 2025";
  const TOTAL_LIQUIDITY = 100000;

  for (const artist of SPOTIFY_ARTISTS) {
    const yesReserve = Math.sqrt(TOTAL_LIQUIDITY * artist.prob);
    const noReserve = Math.sqrt(TOTAL_LIQUIDITY * (1 - artist.prob));

    const title = `${artist.name} Top Spotify Artist 2025`;
    const existingMarket = await db
      .select()
      .from(markets)
      .where(eq(markets.title, title))
      .limit(1);

    if (existingMarket.length > 0) {
      console.log(`  ⏭️  ${artist.name} already exists, skipping...`);
      continue;
    }

    await db.insert(markets).values({
      title: `${artist.name} Top Spotify Artist 2025`,
      description: `Will ${artist.name} be the #1 most-streamed artist globally on Spotify for 2025? Resolves based on official Spotify Wrapped data.`,
      category: "culture",
      tags: [EVENT_TAG, "Music", "Spotify"],
      status: "active",
      endDate: new Date("2026-01-31T23:59:59Z"),
      yesReserve: yesReserve.toFixed(2),
      noReserve: noReserve.toFixed(2),
      totalVolume: "0.00",
      resolutionSource: "Official Spotify Wrapped announcement",
      polymarketSlug: `top-spotify-artist-2025-146-${artist.name.toLowerCase().replace(/\s+/g, "-")}`,
    });

    console.log(`  ✓ Created market: ${artist.name} (${(artist.prob * 100).toFixed(1)}%)`);
  }

  console.log("✅ Spotify event seeding complete!");
}

seedSpotifyEvent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding Spotify event:", error);
    process.exit(1);
  });
