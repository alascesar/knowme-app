import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';

// Note: For client-side React apps, direct Postgres connections won't work in the browser.
// This file is set up for server-side usage (e.g., API routes, serverless functions).
// For client-side, we'll use a hybrid approach: Drizzle schema for types + Supabase client for execution.

// Get database connection string from environment
// For Supabase, use the connection pooler URL from:
// Settings > Database > Connection Pooling > Session mode
// Or the direct connection string from Settings > Database
const getConnectionString = (): string => {
  const dbUrl = process.env.DATABASE_URL || import.meta.env.VITE_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('Missing DATABASE_URL or VITE_DATABASE_URL environment variable. Please set it in .env.local');
  }
  return dbUrl;
};

// Create a singleton database connection
// This should only be used server-side (API routes, serverless functions)
let sql: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (db) return db;

  const connectionString = getConnectionString();
  
  // Create postgres connection
  sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Create drizzle instance with schema
  db = drizzle(sql, { schema });

  return db;
};

// Export schema for use in queries
export { schema };

