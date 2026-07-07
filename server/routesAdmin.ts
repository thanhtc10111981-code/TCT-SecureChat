import express from 'express';
import { db, pool } from '../src/db/index.ts';
import { users, messages, settings } from '../src/db/schema.ts';
import { eq, or, and } from 'drizzle-orm';
import { getDriveAuthUrl, exchangeCodeForRefreshToken, deleteFileFromDrive } from './gdrive.ts';

const router = express.Router();

// Generate Google Drive Auth URL for Admin
router.post('/admin/gdrive/auth-url', async (req, res) => {
  try {
    const { clientId, redirectUri } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'Thiếu Client ID.' });
    }
    const authUrl = getDriveAuthUrl(clientId, redirectUri);
    res.json({ authUrl });
  } catch (err: any) {
    console.error('Error generating Drive auth URL:', err);
    res.status(500).json({ error: 'Không thể tạo link liên kết Google Drive.' });
  }
});

// OAuth2 Callback for Google Drive Authentication
router.get('/admin/gdrive/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('<h1>Lỗi: Thiếu mã xác thực (authorization code) từ Google.</h1>');
    }

    const results = await db.select().from(settings).where(eq(settings.id, 1));
    const currentSettings = results[0];
    if (!currentSettings || !currentSettings.gdriveClientId || !currentSettings.gdriveClientSecret) {
      return res.status(400).send('<h1>Lỗi: Chưa cấu hình Client ID hoặc Client Secret trong cấu hình hệ thống.</h1>');
    }

    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const redirectUri = `${proto}://${req.get('host')}/api/admin/gdrive/callback`;
    const refreshToken = await exchangeCodeForRefreshToken(
      currentSettings.gdriveClientId,
      currentSettings.gdriveClientSecret,
      code as string,
      redirectUri
    );

    await db.update(settings).set({
      gdriveRefreshToken: refreshToken,
      gdriveEnabled: true
    }).where(eq(settings.id, 1));

    res.send(`
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #1e293b; margin: 0;">
          <div style="background-color: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 1px solid #e2e8f0;">
            <h1 style="color: #008075; font-size: 1.5rem; margin-bottom: 1rem;">✓ Liên kết thành công!</h1>
            <p style="font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">Hệ thống đã nhận và lưu trữ cấu hình Google Drive thành công. Bạn có thể đóng tab này và tải lại trang để thấy cập nhật.</p>
            <button onclick="window.close()" style="background-color: #008075; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-family: inherit;">Đóng cửa sổ này</button>
          </div>
          <script>
            setTimeout(() => { window.close(); }, 5000);
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Drive auth callback error:', err);
    res.status(500).send(`<h1>Lỗi liên kết Google Drive: ${err.message}</h1>`);
  }
});

// Get active chat pairs on the system (Admin only)
router.get('/admin/chat-pairs', async (req, res) => {
  try {
    const { adminId } = req.query;
    if (!adminId || typeof adminId !== 'string') {
      return res.status(401).json({ error: 'Thiếu định danh Admin.' });
    }

    const adminUser = await db.select().from(users).where(eq(users.id, adminId));
    if (!adminUser[0] || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập.' });
    }

    const pairsResult = await pool.query(`
      SELECT 
        LEAST(sender_id, recipient_id) AS "user1",
        GREATEST(sender_id, recipient_id) AS "user2",
        COUNT(*)::int AS "count"
      FROM messages
      GROUP BY LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id)
    `);
    const pairsList = pairsResult.rows;
    const usersList = await db.select().from(users);
    const userNames = new Map(usersList.map(u => [u.id, u.name]));

    const responseData = pairsList.map(p => ({
      user1Id: p.user1,
      user1Name: userNames.get(p.user1) || p.user1,
      user2Id: p.user2,
      user2Name: userNames.get(p.user2) || p.user2,
      messageCount: p.count
    }));

    res.json(responseData);
  } catch (error: any) {
    console.error('Get chat pairs error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách cặp chat.' });
  }
});

// Delete all chat between 2 users (Admin only)
router.post('/admin/clear-chat-pair', async (req, res) => {
  try {
    const { adminId, user1, user2 } = req.body;
    if (!adminId) {
      return res.status(401).json({ error: 'Thiếu định danh Admin.' });
    }

    const adminUser = await db.select().from(users).where(eq(users.id, adminId));
    if (!adminUser[0] || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập.' });
    }

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Thiếu thông tin người dùng cần xóa chat.' });
    }

    // Find and delete Google Drive files in background (non-blocking)
    const msgsToDelete = await db.select({ gdriveFileId: messages.gdriveFileId })
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1), eq(messages.recipientId, user2)),
          and(eq(messages.senderId, user2), eq(messages.recipientId, user1))
        )
      );
    
    for (const m of msgsToDelete) {
      if (m.gdriveFileId) {
        deleteFileFromDrive(m.gdriveFileId).catch(gerr => {
          console.error('Error deleting file during clear-chat-pair:', gerr);
        });
      }
    }

    await db.delete(messages)
      .where(
        or(
          and(eq(messages.senderId, user1), eq(messages.recipientId, user2)),
          and(eq(messages.senderId, user2), eq(messages.recipientId, user1))
        )
      );

    res.json({ success: true, message: `Đã xóa sạch toàn bộ cuộc hội thoại giữa ${user1} và ${user2}.` });
  } catch (error: any) {
    console.error('Clear chat pair error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa cuộc hội thoại.' });
  }
});

// Execute custom raw SQL query (Admin only)
router.post('/admin/query-db', async (req, res) => {
  try {
    const { adminId, query } = req.body;
    if (!adminId) {
      return res.status(401).json({ error: 'Thiếu định danh Admin.' });
    }

    const adminUser = await db.select().from(users).where(eq(users.id, adminId));
    if (!adminUser[0] || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập.' });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Câu lệnh SQL không hợp lệ.' });
    }

    const startTime = Date.now();
    const result = await pool.query(query);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      command: result.command,
      rowCount: result.rowCount,
      rows: result.rows || [],
      fields: (result.fields || []).map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
      executionTimeMs
    });
  } catch (error: any) {
    console.error('Query database error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Lỗi cú pháp SQL hoặc thực thi thất bại.'
    });
  }
});

export default router;
