import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, pool } from './src/db/index.ts';
import { users, settings } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';

// Import helpers & routers
import { hashPassword, hashPin } from './server/helpers.ts';
import userRoutes from './server/routesUser.ts';
import chatRoutes from './server/routesChat.ts';
import adminRoutes from './server/routesAdmin.ts';
import otherRoutes from './server/routesOther.ts';

// Global server error trace buffer for debugging on-prem DB connection
export const globalServerErrors: string[] = [];
const originalConsoleError = console.error;
console.error = (...args) => {
  try {
    const msg = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, Object.getOwnPropertyNames(arg));
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    globalServerErrors.unshift(`[${new Date().toLocaleString()}] ${msg}`);
    if (globalServerErrors.length > 100) {
      globalServerErrors.pop();
    }
  } catch (e) {
    // Ignore buffer error
  }
  originalConsoleError(...args);
};

// Log unhandled rejections or uncaught exceptions
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection on Server:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception on Server:', error);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
let isDbCooldown = false;

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
    console.log('[PostgreSQL] Running in production mode.');
  } else {
    console.log('[PostgreSQL] Running in development mode using the pre-configured system database proxy.');
  }

  // Seed database on server startup asynchronously to prevent blocking server port binding / health checks
  seedDatabase().then(() => {
    console.log('[PostgreSQL] Database connections fully initialized and open for requests.');
  }).catch(err => {
    console.error('[PostgreSQL] Database seeding failed asynchronously:', err);
  });

  // --- API ENDPOINTS (MODULAR ROUTING) ---
  const verifyDebugPassword = (password: any): boolean => {
    if (typeof password !== 'string') return false;
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    const configuredHash = process.env.DEBUG_PASSWORD_HASH || 'ac50145ac8eb33b53c8d1dcc900755c216ec53ebbf77d8dca4f19dfb55337a35';
    return inputHash === configuredHash;
  };

  app.post('/api/debug/error-trace', (req, res) => {
    const { password, clear } = req.body;
    if (!verifyDebugPassword(password)) {
      return res.status(401).json({ error: 'Mật khẩu truy cập trace lỗi không đúng.' });
    }
    if (clear === true || clear === 'true') {
      globalServerErrors.length = 0;
      return res.json({ success: true, logs: [] });
    }
    return res.json({ logs: globalServerErrors });
  });

  app.post('/api/debug/query-db', async (req, res) => {
    const { password, query, testConnection } = req.body;
    if (!verifyDebugPassword(password)) {
      return res.status(401).json({ error: 'Mật khẩu truy cập debug không đúng.' });
    }

    try {
      if (testConnection) {
        const startTime = Date.now();
        const result = await pool.query('SELECT NOW() as now_time;');
        const executionTimeMs = Date.now() - startTime;
        return res.json({
          success: true,
          message: 'Kết nối CSDL thành công!',
          timestamp: result.rows[0].now_time,
          executionTimeMs
        });
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Câu lệnh SQL không hợp lệ.' });
      }

      const startTime = Date.now();
      const result = await pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      return res.json({
        success: true,
        command: result.command,
        rowCount: result.rowCount,
        rows: result.rows || [],
        fields: (result.fields || []).map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
        executionTimeMs
      });
    } catch (error: any) {
      console.error('Debug query DB error:', error);
      return res.status(400).json({
        success: false,
        error: error.stack || error.message || String(error)
      });
    }
  });

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
