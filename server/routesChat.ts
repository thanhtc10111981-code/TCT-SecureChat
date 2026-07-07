import express from 'express';
import { db, getCachedSettings } from '../src/db/index.ts';
import { users, messages, settings } from '../src/db/schema.ts';
import { eq, or, and, gt, lt, desc, inArray } from 'drizzle-orm';
import webpush from 'web-push';
import { deleteFileFromDrive } from './gdrive.ts';
import {
  isUserOnline,
  onlineUsers,
  focusedUsers,
  cameraPermissionUsers,
  sendTelegramNotification
} from './helpers.ts';

const router = express.Router();

// Cooldown tracker for offline notifications to prevent connection pool exhaustion and spam
// Key: recipientId, Value: timestamp of last sent notification
const notificationCooldowns = new Map<string, number>();
const NOTIFICATION_COOLDOWN_MS = 20000; // 20 seconds cooldown

// Get messages for/from specific user
router.get('/messages', async (req, res) => {
  try {
    const { userId, limit } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }

    // Update online status for the user
    onlineUsers.set(userId, Date.now());

    const limitVal = limit ? parseInt(limit as string, 10) : undefined;
    
    let userMessages;
    if (limitVal) {
      userMessages = await db.select()
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
        .orderBy(desc(messages.timestamp))
        .limit(limitVal);
      
      userMessages.reverse();
    } else {
      userMessages = await db.select()
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)));
      
      userMessages.sort((a: any, b: any) => a.timestamp - b.timestamp);
    }

    res.json(userMessages);
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Không thể tải tin nhắn.' });
  }
});

// Get total unread messages count for a user
router.get('/messages/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }
    const unreadList = await db.select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.isRead, false),
          eq(messages.isDestroyed, false)
        )
      );
    res.json({ count: unreadList.length });
  } catch (error: any) {
    console.error('Get unread-count error:', error);
    res.status(500).json({ error: 'Không thể tính số tin nhắn chưa đọc.' });
  }
});

// Incremental synchronization API
router.get('/messages/sync', async (req, res) => {
  try {
    const { userId, sinceTimestamp, pendingIds, loadedIds, isFocused, hasCameraPermission } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }

    // Update online status
    onlineUsers.set(userId, Date.now());
    if (isFocused === 'true') {
      focusedUsers.set(userId, Date.now());
    } else {
      focusedUsers.delete(userId);
    }
    if (hasCameraPermission !== undefined) {
      cameraPermissionUsers.set(userId, hasCameraPermission === 'true');
    }

    const since = sinceTimestamp ? parseInt(sinceTimestamp as string, 10) : 0;

    // 1. Get new messages since last sync timestamp
    const newMessages = await db.select()
      .from(messages)
      .where(
        and(
          or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
          gt(messages.timestamp, since)
        )
      );

    // 2. Get status updates for pending messages
    let statusUpdates: any[] = [];
    if (pendingIds && typeof pendingIds === 'string' && pendingIds.trim().length > 0) {
      const ids = pendingIds.split(',');
      statusUpdates = await db.select({
        id: messages.id,
        isRead: messages.isRead,
        readAt: messages.readAt,
        isDestroyed: messages.isDestroyed
      })
      .from(messages)
      .where(
        and(
          or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
          inArray(messages.id, ids)
        )
      );
    }

    // 3. Detect which previously loaded messages have been deleted from DB
    let deletedIds: string[] = [];
    if (loadedIds && typeof loadedIds === 'string' && loadedIds.trim().length > 0) {
      const ids = loadedIds.split(',');
      const existingMessages = await db.select({
        id: messages.id
      })
      .from(messages)
      .where(
        and(
          or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
          inArray(messages.id, ids)
        )
      );
      const existingSet = new Set(existingMessages.map(m => m.id));
      deletedIds = ids.filter(id => !existingSet.has(id));
    }

    res.json({
      newMessages,
      statusUpdates,
      deletedIds
    });
  } catch (error: any) {
    console.error('Sync messages error:', error);
    res.status(500).json({ error: 'Không thể đồng bộ tin nhắn.' });
  }
});

// Get messages for a specific conversation with pagination
router.get('/messages/conversation', async (req, res) => {
  try {
    const { userId, recipientId, limit, beforeTimestamp } = req.query;
    if (!userId || !recipientId || typeof userId !== 'string' || typeof recipientId !== 'string') {
      return res.status(400).json({ error: 'Thiếu thông tin người dùng.' });
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 30;
    const before = beforeTimestamp ? parseInt(beforeTimestamp as string, 10) : Date.now();

    const convMessages = await db.select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderId, userId), eq(messages.recipientId, recipientId)),
            and(eq(messages.senderId, recipientId), eq(messages.recipientId, userId))
          ),
          lt(messages.timestamp, before)
        )
      )
      .orderBy(desc(messages.timestamp))
      .limit(limitNum);

    res.json(convMessages);
  } catch (error: any) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Không thể tải tin nhắn cuộc hội thoại.' });
  }
});

// Post a new encrypted message
router.post('/messages', async (req, res) => {
  try {
    const { senderId, recipientId, encryptedPayload, selfDestructDuration, gdriveFileId, timestamp } = req.body;
    if (!senderId || !recipientId || !encryptedPayload) {
      return res.status(400).json({ error: 'Thiếu dữ liệu gửi tin nhắn.' });
    }

    const messageId = `msg-${Math.random().toString(36).substring(2, 10)}`;
    const newMessage = {
      id: messageId,
      senderId,
      recipientId,
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
      encryptedPayload,
      selfDestructDuration: selfDestructDuration !== undefined ? selfDestructDuration : null,
      readAt: null,
      isRead: false,
      isDestroyed: false,
      gdriveFileId: gdriveFileId || null
    };

    await db.insert(messages).values(newMessage);

    res.status(201).json(newMessage);

    // Track online user
    onlineUsers.set(senderId, Date.now());

    // Trigger notifications asynchronously if recipient is offline (background worker style)
    const isOnline = isUserOnline(recipientId);
    if (!isOnline) {
      const now = Date.now();
      const lastNotifTime = notificationCooldowns.get(recipientId) || 0;
      if (now - lastNotifTime > NOTIFICATION_COOLDOWN_MS) {
        notificationCooldowns.set(recipientId, now);
        
        setImmediate(async () => {
          try {
            const [usersResults, currentSettings] = await Promise.all([
              db.select().from(users).where(inArray(users.id, [recipientId, senderId])),
              getCachedSettings()
            ]);
            const recipient = usersResults.find(u => u.id === recipientId);
            const sender = usersResults.find(u => u.id === senderId);

            if (recipient) {
              const botToken = currentSettings?.telegramBotToken;
              const chatId = recipient?.telegramChatId;
              
              const prefs = (recipient.notificationPreferences as any) || { webPush: true, telegram: true };

              // 1. Send Web Push Notification if enabled
              if (prefs.webPush !== false) {
                const subs = (recipient.pushSubscriptions as any[]) || [];
                if (subs.length > 0) {
                  const payload = JSON.stringify({
                    title: 'Báo Dân trí',
                    body: 'Bài đăng mới',
                    tag: 'dantri-new-message'
                  });

                  const activeSubs: any[] = [];
                  for (const sub of subs) {
                    try {
                      await webpush.sendNotification(sub, payload);
                      activeSubs.push(sub);
                    } catch (err: any) {
                      if (err.statusCode === 404 || err.statusCode === 410) {
                        console.log(`[WebPush] Removing expired subscription for user ${recipient.id}`);
                      } else {
                        console.error('[WebPush] Error sending push notification:', err);
                        activeSubs.push(sub);
                      }
                    }
                  }

                  if (activeSubs.length !== subs.length) {
                    await db.update(users).set({ pushSubscriptions: activeSubs }).where(eq(users.id, recipient.id));
                  }
                }
              }

              // 2. Send Telegram Notification if enabled
              if (prefs.telegram !== false && botToken && chatId) {
                const senderName = sender ? sender.name : 'Một tác giả';
                const notificationText = `Có một bài viết mới trên báo Dân trí của tác giả ${senderName}`;
                sendTelegramNotification(botToken, chatId, notificationText);
              }
            }
          } catch (bgError) {
            console.error('Background notification dispatch error:', bgError);
          }
        });
      }
    }
  } catch (error: any) {
    console.error('Post message error:', error);
    res.status(500).json({ error: 'Không thể gửi tin nhắn.' });
  }
});

// Mark message as read (starts self destruct countdown)
router.post('/messages/read', async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: 'Thiếu messageId.' });
    }

    const updated = await db.update(messages)
      .set({ isRead: true, readAt: Date.now() })
      .where(and(eq(messages.id, messageId), eq(messages.isRead, false)))
      .returning();
      
    if (updated.length > 0) {
      return res.json(updated[0]);
    }

    // If not updated (already read or doesn't exist), fetch it
    const msgResults = await db.select().from(messages).where(eq(messages.id, messageId));
    const msg = msgResults[0];
    if (msg) {
      return res.json(msg);
    }

    res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
  } catch (error: any) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Không thể đánh dấu tin nhắn đã đọc.' });
  }
});

// Mark messages as read in batch
router.post('/messages/read-batch', async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách messageIds không hợp lệ.' });
    }

    const updated = await db.update(messages)
      .set({ isRead: true, readAt: Date.now() })
      .where(and(inArray(messages.id, messageIds), eq(messages.isRead, false)))
      .returning();

    res.json({ success: true, count: updated.length });
  } catch (error: any) {
    console.error('Mark batch messages read error:', error);
    res.status(500).json({ error: 'Không thể đánh dấu hàng loạt tin nhắn đã đọc.' });
  }
});

// Self-destruct action
router.post('/messages/destroy', async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: 'Thiếu messageId.' });
    }

    const msgResults = await db.select().from(messages).where(eq(messages.id, messageId));
    const msg = msgResults[0];
    if (msg) {
      // Delete from Google Drive if exists in background (non-blocking)
      if (msg.gdriveFileId) {
        deleteFileFromDrive(msg.gdriveFileId).catch(gerr => {
          console.error('Error deleting file during message destroy:', gerr);
        });
      }

      await db.update(messages)
        .set({
          isDestroyed: true,
          encryptedPayload: {
            ciphertext: '',
            encryptedKey: '',
            iv: '',
            isMockPayload: false
          },
          gdriveFileId: null
        })
        .where(eq(messages.id, messageId));

      return res.json({ success: true, message: 'Tin nhắn đã hủy hoàn toàn khỏi máy chủ!' });
    }

    res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
  } catch (error: any) {
    console.error('Self destruct error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi tự hủy tin nhắn.' });
  }
});

// Batch delete/hard-delete selected messages
router.post('/messages/batch-delete', async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Thiếu danh sách messageIds.' });
    }

    if (messageIds.length === 0) {
      return res.json({ success: true, message: 'Không có tin nhắn nào được chọn để xóa.' });
    }

    // Find and delete Google Drive files in background (non-blocking)
    const msgsToDelete = await db.select({ gdriveFileId: messages.gdriveFileId })
      .from(messages)
      .where(inArray(messages.id, messageIds));
    
    for (const m of msgsToDelete) {
      if (m.gdriveFileId) {
        deleteFileFromDrive(m.gdriveFileId).catch(gerr => {
          console.error('Error deleting file during batch-delete:', gerr);
        });
      }
    }

    await db.delete(messages).where(inArray(messages.id, messageIds));

    res.json({ success: true, message: `Đã xóa thành công ${messageIds.length} tin nhắn khỏi hệ thống.` });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xóa các tin nhắn.' });
  }
});

// Clear all chats (Admin function)
router.post('/messages/clear', async (req, res) => {
  try {
    // Find and delete all Google Drive files in background (non-blocking)
    const allFileMsgs = await db.select({ gdriveFileId: messages.gdriveFileId })
      .from(messages);
    for (const m of allFileMsgs) {
      if (m.gdriveFileId) {
        deleteFileFromDrive(m.gdriveFileId).catch(gerr => {
          console.error('Error deleting file during clear-all-chats:', gerr);
        });
      }
    }

    await db.delete(messages);
    res.json({ success: true, message: 'Đã xóa tất cả tin nhắn trên máy chủ.' });
  } catch (error: any) {
    console.error('Clear chats error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xóa tin nhắn.' });
  }
});

export default router;
