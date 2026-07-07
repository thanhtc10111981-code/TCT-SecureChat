import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { users, settings } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';

// Import helpers & routers
import { hashPassword, hashPin } from './server/helpers.ts';
import userRoutes from './server/routesUser.ts';
import chatRoutes from './server/routesChat.ts';
import adminRoutes from './server/routesAdmin.ts';
import otherRoutes from './server/routesOther.ts';

const PORT = 3000;

// Default initial users for seeding
const DEFAULT_USERS = [
  {
    id: 'phong',
    username: 'phong',
    password: hashPassword('password123'),
    name: 'Phong (Quản trị)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    role: 'admin',
    publicKeySpki: null,
    isBiometricRegistered: true,
    biometricType: 'fingerprint',
    pinCode: hashPin('1981'),
    friends: ['linh'],
    telegramChatId: null,
    allowDelayLock: false
  },
  {
    id: 'linh',
    username: 'linh',
    password: hashPassword('securepassword'),
    name: 'Linh (Đối tác)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    role: 'user',
    publicKeySpki: null,
    isBiometricRegistered: true,
    biometricType: 'face',
    pinCode: hashPin('2026'),
    friends: ['phong'],
    telegramChatId: null,
    allowDelayLock: false
  }
];

// Seed initial database state if tables are empty
async function seedDatabase() {
  try {
    console.log('[PostgreSQL] Checking database seeding...');
    
    // Check if users exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('[PostgreSQL] No users found, seeding default Phong and Linh profiles...');
      await db.insert(users).values(DEFAULT_USERS);
    } else {
      // Automigration: Securely migrate any existing plaintext PINs to SHA-256 hashes
      for (const u of existingUsers) {
        if (u.pinCode && u.pinCode.length < 64) {
          const hashed = hashPin(u.pinCode);
          console.log(`[PostgreSQL] Automatically hashing plaintext PIN for existing user: ${u.username}`);
          await db.update(users).set({ pinCode: hashed }).where(eq(users.id, u.id));
        }
      }
    }

    // Check if settings exist
    const existingSettings = await db.select().from(settings).where(eq(settings.id, 1));
    if (existingSettings.length === 0) {
      console.log('[PostgreSQL] Seeding default settings...');
      const keys = webpush.generateVAPIDKeys();
      await db.insert(settings).values({
        id: 1,
        isStrictRealMode: false,
        telegramBotToken: '',
        isAuthBioEnabled: true,
        isAuthPinEnabled: true,
        isAuthPwdEnabled: true,
        vapidPublicKey: keys.publicKey,
        vapidPrivateKey: keys.privateKey
      });
      webpush.setVapidDetails(
        'mailto:thanhtc10111981@gmail.com',
        keys.publicKey,
        keys.privateKey
      );
      console.log('[WebPush] Initialized and configured generated VAPID keys.');
    } else {
      let appSettings = existingSettings[0];
      if (!appSettings.vapidPublicKey || !appSettings.vapidPrivateKey) {
        console.log('[WebPush] VAPID keys not found, generating now...');
        const keys = webpush.generateVAPIDKeys();
        await db.update(settings).set({
          vapidPublicKey: keys.publicKey,
          vapidPrivateKey: keys.privateKey
        }).where(eq(settings.id, 1));
        appSettings.vapidPublicKey = keys.publicKey;
        appSettings.vapidPrivateKey = keys.privateKey;
      }
      
      webpush.setVapidDetails(
        'mailto:thanhtc10111981@gmail.com',
        appSettings.vapidPublicKey!,
        appSettings.vapidPrivateKey!
      );
      console.log('[WebPush] Configured VAPID details successfully.');
    }
    console.log('[PostgreSQL] Database seeding checks completed.');
  } catch (err) {
    console.error('[PostgreSQL] Failed to seed database:', err);
  }
}

// Global flag to hold database queries during startup cooldown
let isDbCooldown = true;

async function ensureProxyRunning() {
  const sqlHost = process.env.SQL_HOST || '';
  const connectionName = path.basename(sqlHost);
  const customSocketDir = '/tmp/cloudsql';
  const customHost = path.join(customSocketDir, connectionName);
  const socketFile = path.join(customHost, '.s.PGSQL.5432');

  console.log('[Proxy] Checking local Cloud SQL Proxy...');
  console.log(`[Proxy] Target connection: ${connectionName}`);
  console.log(`[Proxy] Custom socket file path: ${socketFile}`);

  // Ensure tmp directory exists
  fs.mkdirSync(customSocketDir, { recursive: true });

  // Remove stale socket file if any
  if (fs.existsSync(socketFile)) {
    console.log('[Proxy] Removing stale socket file...');
    try {
      fs.unlinkSync(socketFile);
    } catch (e) {
      console.error('[Proxy] Failed to remove stale socket file:', e);
    }
  }

  // Spawn Cloud SQL Proxy pointing to /tmp/cloudsql
  console.log('[Proxy] Spawning fresh background Cloud SQL Proxy process...');
  const proxyProcess = spawn('/app/cloud_sql_proxy', [
    connectionName,
    `--unix-socket=${customSocketDir}`,
    '--sql-data',
    '--sql-data-endpoint=sqladmin.googleapis.com',
    '--sqladmin-api-endpoint=sqladmin.googleapis.com',
    '--impersonate-service-account=service-803105501197@gcp-sa-run-ai.iam.gserviceaccount.com'
  ], {
    detached: true,
    stdio: 'ignore'
  });

  proxyProcess.unref();

  // Wait for socket file to be created (up to 10 seconds)
  console.log('[Proxy] Waiting for proxy to listen on socket file...');
  let socketReady = false;
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(socketFile)) {
      socketReady = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (socketReady) {
    console.log('[Proxy] Proxy started and socket file is ready!');
  } else {
    console.error('[Proxy] Warning: Timed out waiting for socket file to be created. Connection attempts may fail.');
  }
}

async function startServer() {
  const app = express();

  // Support large base64 uploads for images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Middleware to block API requests during database cooldown
  app.use((req, res, next) => {
    if (isDbCooldown && req.path.startsWith('/api')) {
      return res.status(503).json({ error: 'Database is warming up, please wait.' });
    }
    next();
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    console.log('[PostgreSQL] Running in production mode. Bypassing development proxy and cooldown.');
    isDbCooldown = false;
  } else {
    console.log('[PostgreSQL] Running in development mode. Initializing database proxy...');
    await ensureProxyRunning();
    isDbCooldown = false;
  }

  // Seed database on server startup
  await seedDatabase();
  console.log('[PostgreSQL] Database connections fully initialized and open for requests.');

  // --- API ENDPOINTS (MODULAR ROUTING) ---
  app.use('/api', userRoutes);
  app.use('/api', chatRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', otherRoutes);

  // --- VITE INTERFACE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
