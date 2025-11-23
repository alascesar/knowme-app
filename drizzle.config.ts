import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // For Supabase, you can use the connection pooler URL
    // Get this from Supabase Dashboard > Settings > Database > Connection Pooling
    // Or use the direct connection string from Settings > Database > Connection string
    url: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
});

