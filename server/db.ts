// Code based on javascript_database blueprint
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 5000,
  maxUses: 1000,
  allowExitOnIdle: true,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err);
});

export const db = drizzle({ client: pool, schema });
