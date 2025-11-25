// Database connection using postgres.js driver
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Get DATABASE_URL from environment variable only
// Note: We no longer use /tmp/replitdb to avoid stale production database URLs
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    console.log('[Database] Using DATABASE_URL from environment variable');
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Export the URL for use by other modules (like session store)
export const databaseUrl = getDatabaseUrl();

// Neon requires { prepare: false } for Transaction pooling mode
// Added retry and connection resilience for Neon cold starts
export const client = postgres(databaseUrl, { 
  prepare: false,
  max: 5,
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
  connect_timeout: 30,
  connection: {
    application_name: 'palpites-ai'
  }
});

export const db = drizzle({ client, schema });

// Test connection on startup with retries
export async function testConnection(retries = 3, delay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client`SELECT 1`;
      console.log('[Database] ✓ Connection established');
      return true;
    } catch (error: any) {
      const isNeonSuspended = error?.message?.includes('endpoint has been disabled');
      console.log(`[Database] Connection attempt ${attempt}/${retries} failed${isNeonSuspended ? ' (Neon endpoint suspended, waking up...)' : ''}`);
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  console.error('[Database] ✗ Failed to establish connection after retries');
  return false;
}
