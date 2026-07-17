import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const rawHost = process.env.SQL_HOST || '';
  const host = rawHost;
  
  // Parse pool configurations with safe fallbacks
  const max = process.env.SQL_POOL_MAX ? parseInt(process.env.SQL_POOL_MAX, 10) : 5;
  const idleTimeoutMillis = process.env.SQL_POOL_IDLE_TIMEOUT 
    ? parseInt(process.env.SQL_POOL_IDLE_TIMEOUT, 10) 
    : 15000; // Reap idle connections faster (default 15s) to avoid silent firewall drops
  const connectionTimeoutMillis = process.env.SQL_CONNECTION_TIMEOUT 
    ? parseInt(process.env.SQL_CONNECTION_TIMEOUT, 10) 
    : 15000;

  // SSL configuration supporting explicit flags or environment defaults
  let ssl: any = undefined; // Default to undefined (let node-postgres handle it based on connectionString)
  if (process.env.SQL_SSL === 'true') {
    ssl = { rejectUnauthorized: false }; // Useful for self-signed certificates in local Docker environments
  } else if (process.env.SQL_SSL === 'false') {
    ssl = false;
  } else if (process.env.PGSSLMODE) {
    ssl = undefined; // Delegate completely to node-postgres environment handling
  }

  const connectionString = process.env.DATABASE_URL || process.env.SQL_URL;

  return new Pool({
    connectionString,
    host: connectionString ? undefined : host,
    port: connectionString ? undefined : (process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : undefined),
    user: connectionString ? undefined : process.env.SQL_USER,
    password: connectionString ? undefined : process.env.SQL_PASSWORD,
    database: connectionString ? undefined : process.env.SQL_DB_NAME,
    connectionTimeoutMillis,
    max,
    idleTimeoutMillis,
    ssl,
    // Enable TCP Keep-Alive to prevent firewalls/NATs from dropping idle connections silently
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // Send TCP keepalive probes every 10 seconds
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
const CACHE_TTL = 30000; // 30 seconds
let isFetchingSettings = false;

export async function getCachedSettings() {
  const now = Date.now();
  if (cachedSettings && (now - lastCacheTime < CACHE_TTL)) {
    return cachedSettings;
  }
  
  // Prevent parallel overlapping queries from slamming the database
  if (isFetchingSettings) {
    return cachedSettings || {
      id: 1,
      isStrictRealMode: false,
      telegramBotToken: '',
      isAuthBioEnabled: true,
      isAuthPinEnabled: true,
      isAuthPwdEnabled: true,
      isKeySharingEnabled: false,
      systemShorthands: null,
      disguiseArticleTitle: '',
      disguiseArticleContent: ''
    };
  }

  isFetchingSettings = true;
  try {
    const results = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
    if (results[0]) {
      cachedSettings = results[0];
    } else {
      cachedSettings = {
        id: 1,
        isStrictRealMode: false,
        telegramBotToken: '',
        isAuthBioEnabled: true,
        isAuthPinEnabled: true,
        isAuthPwdEnabled: true,
        isKeySharingEnabled: false,
        systemShorthands: null,
        disguiseArticleTitle: '',
        disguiseArticleContent: ''
      };
    }
    lastCacheTime = now;
  } catch (err) {
    // Only log the error, then establish cached fallback with cooldown to prevent slamming the server
    console.error('Error fetching settings for cache:', err);
    
    cachedSettings = {
      id: 1,
      isStrictRealMode: false,
      telegramBotToken: '',
      isAuthBioEnabled: true,
      isAuthPinEnabled: true,
      isAuthPwdEnabled: true,
      isKeySharingEnabled: false,
      systemShorthands: null,
      disguiseArticleTitle: '',
      disguiseArticleContent: ''
    };
    lastCacheTime = now; // Cool down further checks for CACHE_TTL duration
  } finally {
    isFetchingSettings = false;
  }
  
  return cachedSettings;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  lastCacheTime = 0;
}

