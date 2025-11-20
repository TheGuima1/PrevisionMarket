// Database connection for Supabase using postgres.js driver
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase requires { prepare: false } for Transaction pooling mode
export const client = postgres(process.env.DATABASE_URL, { 
  prepare: false,
  max: 3,
  idle_timeout: 5,
  max_lifetime: 1000,
  connect_timeout: 10,
});

export const db = drizzle({ client, schema });
