import express from 'express';
import { db, getCachedSettings, invalidateSettingsCache } from '../src/db/index.ts';
import { users, settings } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';
import { getDriveAccessToken, uploadFileToDrive, downloadFileFromDrive } from './gdrive.ts';

const router = express.Router();

// Proxy to fetch latest Dantri article with proper abort timeout and offline fallback handling
router.get('/dantri/latest', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://dantri.com.vn/rss/tin-noi-bat.rss', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Dantri RSS response not ok');
    }

    const text = await response.text();
    const items = text.split('<item>');
    if (items.length < 2) {
      throw new Error('No items in Dantri RSS');
    }

    const firstItem = items[1];
    const titleMatch = firstItem.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || firstItem.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = firstItem.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || firstItem.match(/<description>([\s\S]*?)<\/description>/);
    const linkMatch = firstItem.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = firstItem.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    const title = titleMatch ? titleMatch[1].trim() : 'Báo điện tử Dân trí';
    let descText = descMatch ? descMatch[1].trim() : '';
    let imageUrl = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400';
    
    const imgMatch = descText.match(/src="([^"]+)"/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
    
    descText = descText.replace(/<[^>]+>/g, '').trim();

    res.json({
      success: true,
      article: {
        id: 'dantri-live',
        title: title,
        category: 'TIN NÓI BẬT DÂN TRÍ',
        time: pubDateMatch ? new Date(pubDateMatch[1]).toLocaleTimeString('vi-VN') + ' - ' + new Date(pubDateMatch[1]).toLocaleDateString('vi-VN') : 'Vừa xong',
        author: 'Ban Biên tập Dân trí',
        summary: descText || 'Cập nhật tin tức nóng hổi liên tục trong ngày trên báo điện tử Dân trí.',
        image: imageUrl,
        content: `${descText}\n\nĐọc tiếp nội dung bài báo chi tiết trên Báo điện tử Dân trí để cập nhật thông tin xã hội, kinh tế, đời sống chính xác nhất.\n\nThông tin luôn được ban biên tập Dân trí kiểm duyệt nghiêm ngặt trước khi đăng tải để mang lại trải nghiệm tin cậy cho bạn đọc khắp cả nước.`
      }
    });
  } catch (e: any) {
    console.error('Fetch Dantri latest error:', e);
    res.status(504).json({ success: false, error: 'Không thể kết nối lấy tin tức mới từ Dân trí.' });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    let currentSettings = await getCachedSettings();
    if (!currentSettings) {
      await db.insert(settings).values({
        id: 1,
        isStrictRealMode: false,
        telegramBotToken: '',
        isAuthBioEnabled: true,
        isAuthPinEnabled: true,
        isAuthPwdEnabled: true,
        vapidPublicKey: null,
        vapidPrivateKey: null,
        gdriveClientId: '',
        gdriveClientSecret: '',
        gdriveRefreshToken: '',
        gdriveFolderId: '',
        gdriveEnabled: false
      }).onConflictDoNothing();
      invalidateSettingsCache();
      currentSettings = await getCachedSettings();
    }
    res.json(currentSettings);
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Không thể tải cấu hình hệ thống.' });
  }
});

// Update system settings
router.post('/settings', async (req, res) => {
  try {
    const { 
      isStrictRealMode, 
      telegramBotToken, 
      isAuthBioEnabled, 
      isAuthPinEnabled, 
      isAuthPwdEnabled,
      gdriveClientId,
      gdriveClientSecret,
      gdriveRefreshToken,
      gdriveFolderId,
      gdriveEnabled
    } = req.body;

    const results = await db.select().from(settings).where(eq(settings.id, 1));
    const currentSettings = results[0];

    const updateData: any = {};
    if (typeof isStrictRealMode === 'boolean') {
      updateData.isStrictRealMode = isStrictRealMode;
    }
    if (typeof telegramBotToken === 'string') {
      updateData.telegramBotToken = telegramBotToken;
    }
    if (typeof isAuthBioEnabled === 'boolean') {
      updateData.isAuthBioEnabled = isAuthBioEnabled;
    }
    if (typeof isAuthPinEnabled === 'boolean') {
      updateData.isAuthPinEnabled = isAuthPinEnabled;
    }
    if (typeof isAuthPwdEnabled === 'boolean') {
      updateData.isAuthPwdEnabled = isAuthPwdEnabled;
    }
    if (typeof gdriveClientId === 'string') {
      updateData.gdriveClientId = gdriveClientId;
    }
    if (typeof gdriveClientSecret === 'string') {
      updateData.gdriveClientSecret = gdriveClientSecret;
    }
    if (typeof gdriveRefreshToken === 'string') {
      updateData.gdriveRefreshToken = gdriveRefreshToken;
    }
    if (typeof gdriveFolderId === 'string') {
      updateData.gdriveFolderId = gdriveFolderId;
    }
    if (typeof gdriveEnabled === 'boolean') {
      updateData.gdriveEnabled = gdriveEnabled;
    }

    if (!currentSettings) {
      await db.insert(settings).values({ id: 1, ...updateData });
    } else {
      await db.update(settings).set(updateData).where(eq(settings.id, 1));
    }

    invalidateSettingsCache();
    const updatedUserSetting = await getCachedSettings();
    res.json({ success: true, settings: updatedUserSetting });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Không thể cập nhật cấu hình hệ thống.' });
  }
});

// Google Drive File Upload API
router.post('/gdrive/upload', async (req, res) => {
  try {
    const { fileName, mimeType, base64Data } = req.body;
    if (!fileName || !base64Data) {
      return res.status(400).json({ error: 'Thiếu thông tin tệp gửi lên.' });
    }

    const currentSettings = await getCachedSettings();
    if (!currentSettings || !currentSettings.gdriveEnabled || !currentSettings.gdriveClientId || !currentSettings.gdriveClientSecret || !currentSettings.gdriveRefreshToken) {
      return res.status(400).json({ error: 'Chức năng truyền file chưa được bật hoặc chưa hoàn tất cấu hình Google Drive trong cài đặt hệ thống.' });
    }

    const accessToken = await getDriveAccessToken(
      currentSettings.gdriveClientId,
      currentSettings.gdriveClientSecret,
      currentSettings.gdriveRefreshToken
    );

    const fileInfo = await uploadFileToDrive(
      accessToken,
      fileName,
      mimeType,
      base64Data,
      currentSettings.gdriveFolderId || undefined
    );

    res.json({ success: true, fileId: fileInfo.id, fileName: fileInfo.name });
  } catch (err: any) {
    console.error('GDrive upload error:', err);
    res.status(500).json({ error: `Lỗi tải tệp lên Google Drive: ${err.message}` });
  }
});

// Google Drive File Proxy/Download API
router.get('/gdrive/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const currentSettings = await getCachedSettings();
    if (!currentSettings || !currentSettings.gdriveClientId || !currentSettings.gdriveClientSecret || !currentSettings.gdriveRefreshToken) {
      return res.status(400).json({ error: 'Chức năng tải tệp qua Google Drive chưa được cấu hình.' });
    }

    const accessToken = await getDriveAccessToken(
      currentSettings.gdriveClientId,
      currentSettings.gdriveClientSecret,
      currentSettings.gdriveRefreshToken
    );

    const fileData = await downloadFileFromDrive(accessToken, fileId);

    res.setHeader('Content-Type', fileData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileData.name)}`);
    res.send(fileData.buffer);
  } catch (err: any) {
    console.error('GDrive download error:', err);
    res.status(500).json({ error: `Lỗi tải tệp từ Google Drive: ${err.message}` });
  }
});

// Get VAPID public key
router.get('/push/vapid-public-key', async (req, res) => {
  try {
    const appSettings = await getCachedSettings();
    if (!appSettings || !appSettings.vapidPublicKey) {
      return res.status(404).json({ error: 'Chưa cấu hình khóa VAPID.' });
    }
    res.json({ publicKey: appSettings.vapidPublicKey });
  } catch (error: any) {
    console.error('Get VAPID key error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra.' });
  }
});

// Subscribe to push notifications
router.post('/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Thiếu userId hoặc subscription.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const subs = (user.pushSubscriptions as any[]) || [];
    const exists = subs.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      await db.update(users).set({ pushSubscriptions: subs }).where(eq(users.id, userId));
    }

    res.json({ success: true, message: 'Đã đăng ký nhận thông báo đẩy thành công!' });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Không thể lưu đăng ký thông báo đẩy.' });
  }
});

// Unsubscribe from push notifications
router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    if (!userId || !endpoint) {
      return res.status(400).json({ error: 'Thiếu thông tin hủy đăng ký.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const subs = (user.pushSubscriptions as any[]) || [];
    const updatedSubs = subs.filter((s) => s.endpoint !== endpoint);

    await db.update(users).set({ pushSubscriptions: updatedSubs }).where(eq(users.id, userId));
    res.json({ success: true, message: 'Đã hủy nhận thông báo đẩy.' });
  } catch (error: any) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ error: 'Không thể hủy thông báo đẩy.' });
  }
});

// Get user notification preferences
router.get('/users/notification-preferences', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const preferences = user.notificationPreferences || { webPush: true, telegram: true };
    res.json({
      preferences,
      telegramChatId: user.telegramChatId
    });
  } catch (error: any) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Không thể lấy cấu hình thông báo.' });
  }
});

// Update user notification preferences
router.post('/users/notification-preferences', async (req, res) => {
  try {
    const { userId, webPush, telegram, telegramChatId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const currentPrefs = (user.notificationPreferences as any) || { webPush: true, telegram: true };
    const newPrefs = {
      webPush: typeof webPush === 'boolean' ? webPush : currentPrefs.webPush,
      telegram: typeof telegram === 'boolean' ? telegram : currentPrefs.telegram
    };

    const updateData: any = { notificationPreferences: newPrefs };
    if (telegramChatId !== undefined) {
      updateData.telegramChatId = telegramChatId ? telegramChatId.toString().trim() : null;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
    res.json({ success: true, preferences: newPrefs, telegramChatId: updateData.telegramChatId });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Không thể lưu cấu hình thông báo.' });
  }
});

// Test Telegram connection
router.post('/telegram/test', async (req, res) => {
  const { token, chatId } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, error: 'Thiếu Telegram Bot Token.' });
  }
  if (!chatId) {
    return res.status(400).json({ success: false, error: 'Thiếu Telegram Chat ID để nhận tin nhắn thử nghiệm.' });
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.toString().trim(),
        text: `🔔 [KIỂM TRA KẾT NỐI]\n\nXin chào! Đây là tin nhắn thử nghiệm từ hệ thống SecureCrypt E2EE Hub (Báo Dân trí).\nHệ thống thông báo Telegram Bot của bạn đã được kết nối thành công!`
      })
    });

    const responseData: any = await response.json();
    if (response.ok && responseData.ok) {
      return res.json({ success: true, message: 'Gửi tin nhắn thử nghiệm thành công! Hãy kiểm tra ứng dụng Telegram của bạn.' });
    } else {
      return res.status(400).json({
        success: false,
        error: responseData.description || `Lỗi từ Telegram API (Mã: ${response.status})`
      });
    }
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      error: `Lỗi kết nối mạng: ${e.message || e}`
    });
  }
});

// Quick ping endpoint to pre-warm the connection/TCP sockets from client-side
router.get('/ping', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

export default router;
