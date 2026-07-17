import { pgTable, text, boolean, integer, bigint, jsonb, index } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Using username in lowercase as primary key
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull().default('user'),
  publicKeySpki: text('public_key_spki'),
  pinCode: text('pin_code'),
  friends: jsonb('friends').default([]), // List of friend user IDs
  telegramChatId: text('telegram_chat_id'),
  pushSubscriptions: jsonb('push_subscriptions').default([]), // Array of push subscriptions
  notificationPreferences: jsonb('notification_preferences').default({ webPush: true, telegram: true }), // Preferences config
  patternLock: text('pattern_lock'),
  allowDelayLock: boolean('allow_delay_lock').default(false),
  theme: text('theme').default('dantri')
});

// Messages Table
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  recipientId: text('recipient_id').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  encryptedPayload: jsonb('encrypted_payload').notNull(),
  selfDestructDuration: integer('self_destruct_duration'),
  readAt: bigint('read_at', { mode: 'number' }),
  isRead: boolean('is_read').default(false),
  isDestroyed: boolean('is_destroyed').default(false),
  gdriveFileId: text('gdrive_file_id'),
  reactions: jsonb('reactions').default({})
}, (table) => ({
  senderIdIdx: index('messages_sender_id_idx').on(table.senderId),
  recipientIdIdx: index('messages_recipient_id_idx').on(table.recipientId),
  timestampIdx: index('messages_timestamp_idx').on(table.timestamp),
  isReadIdx: index('messages_is_read_idx').on(table.isRead),
  isDestroyedIdx: index('messages_is_destroyed_idx').on(table.isDestroyed),
  senderRecipientTimestampIdx: index('messages_sender_recipient_time_idx').on(table.senderId, table.recipientId, table.timestamp),
  recipientSenderTimestampIdx: index('messages_recipient_sender_time_idx').on(table.recipientId, table.senderId, table.timestamp),
}));

// Settings Table
export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  isStrictRealMode: boolean('is_strict_real_mode').default(false),
  telegramBotToken: text('telegram_bot_token').default(''),
  isAuthBioEnabled: boolean('is_auth_bio_enabled').default(true),
  isAuthPinEnabled: boolean('is_auth_pin_enabled').default(true),
  isAuthPwdEnabled: boolean('is_auth_pwd_enabled').default(true),
  vapidPublicKey: text('vapid_public_key'),
  vapidPrivateKey: text('vapid_private_key'),
  gdriveClientId: text('gdrive_client_id').default(''),
  gdriveClientSecret: text('gdrive_client_secret').default(''),
  gdriveRefreshToken: text('gdrive_refresh_token').default(''),
  gdriveFolderId: text('gdrive_folder_id').default(''),
  gdriveEnabled: boolean('gdrive_enabled').default(false),
  isKeySharingEnabled: boolean('is_key_sharing_enabled').default(false),
  systemShorthands: text('system_shorthands'),
  disguiseArticleTitle: text('disguise_article_title').default(''),
  disguiseArticleContent: text('disguise_article_content').default('')
});
