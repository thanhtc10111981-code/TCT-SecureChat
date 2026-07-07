import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const rawHost = process.env.SQL_HOST || '';
  const isProd = process.env.NODE_ENV === 'production';
  const host = isProd ? rawHost : rawHost.replace('/app/cloudsql', '/tmp/cloudsql');
  return new Pool({
    host,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    max: 5, // Limit active connections to prevent triggering Google Cloud SQL Auth Proxy API quota limits
    idleTimeoutMillis: 30000, // Keep idle connections open longer to maximize reuse and minimize new handshakes
    ssl: false,
  });
};

// Create a pool instance.
export const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export type DbType = typeof db;

// Memory cache for system settings
let cachedSettings: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getCachedSettings() {
  const now = Date.now();
  if (cachedSettings && (now - lastCacheTime < CACHE_TTL)) {
    return cachedSettings;
  }
  
  try {
    const results = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
    if (results[0]) {
      cachedSettings = results[0];
      lastCacheTime = now;
      return cachedSettings;
    }
  } catch (err) {
    console.error('Error fetching settings for cache:', err);
  }
  
  return cachedSettings;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  lastCacheTime = 0;
}

