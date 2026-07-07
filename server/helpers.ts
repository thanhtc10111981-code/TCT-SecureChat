import crypto from 'crypto';

// Online user status tracker
export const onlineUsers = new Map<string, number>();
export const focusedUsers = new Map<string, number>();
export const cameraPermissionUsers = new Map<string, boolean>();

export function isUserOnline(userId: string): boolean {
  const lastSeen = onlineUsers.get(userId);
  if (!lastSeen) return false;
  // If user polled or hit endpoint in last 6 seconds, consider online
  return (Date.now() - lastSeen) < 6000;
}

export function isUserFocused(userId: string): boolean {
  const lastFocused = focusedUsers.get(userId);
  if (!lastFocused) return false;
  // If user registered focus in last 6 seconds, and is online, they are focused
  return isUserOnline(userId) && (Date.now() - lastFocused) < 6000;
}

// Helper to hash password using SHA-256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to hash PIN using SHA-256 (same robust crypto as password)
export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// Helper to send telegram notification
export async function sendTelegramNotification(token: string, chatId: string, text: string) {
  if (!token || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });
    if (!res.ok) {
      console.error('[Telegram] Failed to send notification:', await res.text());
    } else {
      console.log(`[Telegram] Sent message to chat ID ${chatId}`);
    }
  } catch (e) {
    console.error('[Telegram] Error sending notification:', e);
  }
}
