import express from 'express';
import { db, getCachedSettings } from '../src/db/index.ts';
import { users, messages, settings } from '../src/db/schema.ts';
import { eq, or, and, gt, lt, desc, inArray } from 'drizzle-orm';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { deleteFileFromDrive } from './gdrive.ts';
import { notifyUserUpdate, syncEmitter } from './sseManager.ts';
import {
  isUserOnline,
  isUserFocused,
  onlineUsers,
  focusedUsers,
  cameraPermissionUsers,
  activeConversations,
  sendTelegramNotification
} from './helpers.ts';

const router = express.Router();

function logNotif(msg: string) {
  try {
    const filePath = path.join(process.cwd(), 'notification_debug.log');
    fs.appendFileSync(filePath, `[${new Date().toISOString()}] ${msg}\n`);
    console.log(`[NotificationDebug] ${msg}`);
  } catch (err) {
    console.error('Failed to write debug log:', err);
  }
}

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

// Actively update focus/active chat status
router.post('/messages/focus', async (req, res) => {
  try {
    const { userId, isFocused, activeRecipientId } = req.body;
    if (userId && typeof userId === 'string') {
      onlineUsers.set(userId, Date.now());
      if (isFocused === true || isFocused === 'true') {
        focusedUsers.set(userId, Date.now());
      } else {
        focusedUsers.delete(userId);
      }
      if (typeof activeRecipientId === 'string' && activeRecipientId.trim() !== '') {
        activeConversations.set(userId, activeRecipientId.trim());
      } else {
        activeConversations.delete(userId);
      }
      // Broadcast user update immediately so other clients see the status update
      notifyUserUpdate(userId);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Update focus error:', error);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái focus.' });
  }
});

// Incremental synchronization API
router.get('/messages/sync', async (req, res) => {
  try {
    const { userId, sinceTimestamp, pendingIds, loadedIds, isFocused, hasCameraPermission, activeRecipientId } = req.query;
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
    if (typeof activeRecipientId === 'string' && activeRecipientId.trim() !== '') {
      activeConversations.set(userId, activeRecipientId.trim());
    } else {
      activeConversations.delete(userId);
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

    // 2. Get status updates for pending and recently loaded messages (including reactions)
    let statusUpdates: any[] = [];
    const updateIdsSet = new Set<string>();
    if (pendingIds && typeof pendingIds === 'string' && pendingIds.trim().length > 0) {
      pendingIds.split(',').forEach(id => { if (id && id.trim()) updateIdsSet.add(id.trim()); });
    }
    if (loadedIds && typeof loadedIds === 'string' && loadedIds.trim().length > 0) {
      loadedIds.split(',').forEach(id => { if (id && id.trim()) updateIdsSet.add(id.trim()); });
    }

    if (updateIdsSet.size > 0) {
      const ids = Array.from(updateIdsSet);
      statusUpdates = await db.select({
        id: messages.id,
        isRead: messages.isRead,
        readAt: messages.readAt,
        isDestroyed: messages.isDestroyed,
        reactions: messages.reactions
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

// SSE Real-time Synchronization Stream
router.get('/messages/sync/stream', (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Thiếu userId.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const onUpdate = (eventUserId: string) => {
    if (eventUserId === userId) {
      try {
        res.write(`data: ${JSON.stringify({ type: 'update', userId })}\n\n`);
      } catch (err) {
        console.error('Error writing SSE update, cleaning up:', err);
        cleanup();
      }
    }
  };

  syncEmitter.on('update', onUpdate);

  const heartbeat = setInterval(() => {
    onlineUsers.set(userId, Date.now());
    try {
      res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    } catch (err) {
      console.error('Error writing SSE ping, cleaning up:', err);
      cleanup();
    }
  }, 4000);

  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    clearInterval(heartbeat);
    syncEmitter.off('update', onUpdate);
    try {
      res.end();
    } catch (e) {
      // Ignore errors when ending a closed response stream
    }
  };

  try {
    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
    onlineUsers.set(userId, Date.now());
  } catch (err) {
    console.error('Error writing SSE initial connection, cleaning up:', err);
    cleanup();
    return;
  }

  req.on('close', cleanup);
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
    const { senderId, recipientId, encryptedPayload, selfDestructDuration, gdriveFileId } = req.body;
    if (!senderId || !recipientId || !encryptedPayload) {
      return res.status(400).json({ error: 'Thiếu dữ liệu gửi tin nhắn.' });
    }

    const messageId = `msg-${Math.random().toString(36).substring(2, 10)}`;
    const newMessage = {
      id: messageId,
      senderId,
      recipientId,
      timestamp: Date.now(),
      encryptedPayload,
      selfDestructDuration: selfDestructDuration !== undefined ? selfDestructDuration : null,
      readAt: null,
      isRead: false,
      isDestroyed: false,
      gdriveFileId: gdriveFileId || null
    };

    await db.insert(messages).values(newMessage);

    res.status(201).json(newMessage);

    // Notify real-time stream
    notifyUserUpdate(senderId);
    notifyUserUpdate(recipientId);

    // Track online user
    onlineUsers.set(senderId, Date.now());

    // Trigger notifications asynchronously if recipient is not actively chatting with the sender
    const isFocused = isUserFocused(recipientId);
    const isRecipientChattingWithSender = activeConversations.get(recipientId) === senderId;
    const isActivelyChatting = isFocused && isRecipientChattingWithSender;

    logNotif(`Gửi tin từ ${senderId} -> ${recipientId}. isFocused(recipient)=${isFocused}, activeConv(recipient)=${activeConversations.get(recipientId)}, isActivelyChatting=${isActivelyChatting}`);

    if (!isActivelyChatting) {
      const now = Date.now();
      const lastNotifTime = notificationCooldowns.get(recipientId) || 0;
      const timeDiff = now - lastNotifTime;
      logNotif(`Recipient ${recipientId} không actively chatting. Thử gửi thông báo. Cooldown timeDiff=${timeDiff}ms (cooldown requirement=${NOTIFICATION_COOLDOWN_MS}ms)`);
      
      if (timeDiff > NOTIFICATION_COOLDOWN_MS) {
        notificationCooldowns.set(recipientId, now);
        logNotif(`Đã qua cooldown. Tiến hành setImmediate gửi thông báo.`);
        
        setImmediate(async () => {
          try {
            logNotif(`setImmediate bắt đầu chạy. Đang query DB cho recipientId=${recipientId}, senderId=${senderId}`);
            const [usersResults, currentSettings] = await Promise.all([
              db.select().from(users).where(inArray(users.id, [recipientId, senderId])),
              getCachedSettings()
            ]);
            
            logNotif(`Query DB hoàn tất. Tìm thấy ${usersResults.length} users: [${usersResults.map(u => u.id).join(', ')}]`);
            const recipient = usersResults.find(u => u.id === recipientId);
            const sender = usersResults.find(u => u.id === senderId);

            if (!recipient) {
              logNotif(`LỖI: Không tìm thấy recipient trong DB với ID=${recipientId}`);
            }
            if (!sender) {
              logNotif(`CẢNH BÁO: Không tìm thấy sender trong DB với ID=${senderId}`);
            }

            if (recipient) {
              const botToken = currentSettings?.telegramBotToken;
              const chatId = recipient?.telegramChatId;
              const senderName = sender ? sender.name : 'Một tác giả';
              
              const prefs = (recipient.notificationPreferences as any) || { webPush: true, telegram: true };
              logNotif(`Preferences của recipient: webPush=${prefs.webPush}, telegram=${prefs.telegram}. Recipient telegramChatId=${chatId}. BotToken=${botToken ? 'Co' : 'Khong'}`);

              const promises: Promise<any>[] = [];

              // 1. Send Web Push Notification if enabled
              if (prefs.webPush !== false) {
                const subs = (recipient.pushSubscriptions as any[]) || [];
                logNotif(`Recipient có ${subs.length} push subscriptions.`);
                if (subs.length > 0) {
                  const payload = JSON.stringify({
                    title: 'Báo Dân trí',
                    body: 'Bài viết mới',
                    tag: 'dantri-new-message'
                  });

                  // Notify all subscriptions in parallel
                  const subPromises = subs.map(async (sub, i) => {
                    try {
                      logNotif(`Đang gửi web push đến subscription index ${i}, endpoint: ${sub.endpoint?.substring(0, 50)}...`);
                      await webpush.sendNotification(sub, payload);
                      logNotif(`Gửi web push thành công cho subscription index ${i}`);
                      return { sub, isValid: true };
                    } catch (err: any) {
                      logNotif(`LỖI gửi web push index ${i}: status=${err.statusCode}, message=${err.message}`);
                      if (err.statusCode === 404 || err.statusCode === 410) {
                        logNotif(`Subscription index ${i} đã hết hạn/không hợp lệ, sẽ xóa.`);
                        return { sub, isValid: false };
                      } else {
                        return { sub, isValid: true };
                      }
                    }
                  });

                  promises.push((async () => {
                    const results = await Promise.all(subPromises);
                    const activeSubs = results.filter(r => r.isValid).map(r => r.sub);
                    if (activeSubs.length !== subs.length) {
                      logNotif(`Cập nhật lại subscriptions mới trong DB cho user ${recipient.id}, từ ${subs.length} còn ${activeSubs.length}`);
                      await db.update(users).set({ pushSubscriptions: activeSubs }).where(eq(users.id, recipient.id));
                    }
                  })());
                } else {
                  logNotif(`Recipient không có subscriptions nào, bỏ qua web push.`);
                }
              } else {
                logNotif(`Recipient đã tắt tính năng web push trong preferences.`);
              }

              // 2. Send Telegram Notification if enabled
              if (prefs.telegram !== false) {
                if (botToken && chatId) {
                  const notificationText = 'Bài viết mới';
                  logNotif(`Đang gửi Telegram đến chatId=${chatId}...`);
                  promises.push((async () => {
                    try {
                      await sendTelegramNotification(botToken, chatId, notificationText);
                      logNotif(`Gửi Telegram thành công!`);
                    } catch (telErr: any) {
                      logNotif(`LỖI gửi Telegram: ${telErr.message}`);
                    }
                  })());
                } else {
                  logNotif(`Bỏ qua Telegram do thiếu botToken (${!!botToken}) hoặc chatId (${!!chatId})`);
                }
              } else {
                logNotif(`Recipient đã tắt tính năng Telegram trong preferences.`);
              }

              if (promises.length > 0) {
                await Promise.all(promises);
              }
            }
          } catch (bgError: any) {
            logNotif(`LỖI trong setImmediate background process: ${bgError.message}`);
            console.error('Background notification dispatch error:', bgError);
          }
        });
      } else {
        logNotif(`Bỏ qua gửi do đang trong thời gian cooldown (${NOTIFICATION_COOLDOWN_MS - timeDiff}ms còn lại).`);
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
      const msg = updated[0];
      notifyUserUpdate(msg.senderId);
      notifyUserUpdate(msg.recipientId);
      return res.json(msg);
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

    if (updated.length > 0) {
      const userIds = new Set<string>();
      for (const m of updated) {
        userIds.add(m.senderId);
        userIds.add(m.recipientId);
      }
      for (const uid of userIds) {
        notifyUserUpdate(uid);
      }
    }

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

      notifyUserUpdate(msg.senderId);
      notifyUserUpdate(msg.recipientId);

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

    notifyUserUpdate('phong');
    notifyUserUpdate('linh');

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
    notifyUserUpdate('phong');
    notifyUserUpdate('linh');
    res.json({ success: true, message: 'Đã xóa tất cả tin nhắn trên máy chủ.' });
  } catch (error: any) {
    console.error('Clear chats error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xóa tin nhắn.' });
  }
});

// Add or remove a reaction on a message
router.post('/messages/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, emoji } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }

    // Fetch the message
    const results = await db.select().from(messages).where(eq(messages.id, id));
    if (results.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
    }

    const messageObj = results[0];
    const currentReactions = (messageObj.reactions as Record<string, string>) || {};

    const updatedReactions = { ...currentReactions };
    if (updatedReactions[userId] === emoji) {
      // Toggle off if same emoji clicked again
      delete updatedReactions[userId];
    } else {
      // Update or add emoji
      updatedReactions[userId] = emoji;
    }

    // Update the db
    await db.update(messages)
      .set({ reactions: updatedReactions })
      .where(eq(messages.id, id));

    notifyUserUpdate(messageObj.senderId);
    notifyUserUpdate(messageObj.recipientId);

    res.json({ success: true, reactions: updatedReactions });
  } catch (error: any) {
    console.error('React to message error:', error);
    res.status(500).json({ error: 'Không thể cập nhật biểu tượng cảm xúc.' });
  }
});

export default router;
