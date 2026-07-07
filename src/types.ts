/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedPayload } from './utils/crypto';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  encryptedPayload: EncryptedPayload;
  decryptedText: string | null; // Null if not decrypted yet or destroyed
  senderDecryptedText?: string; // Plaintext representation for sender view
  selfDestructDuration: number | null; // in seconds, null means no self destruct
  selfDestructTimeRemaining: number | null; // active count down in seconds
  readAt: number | null; // timestamp when read, initiates self-destruct countdown
  isRead: boolean;
  isDestroyed: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export interface UserSession {
  id: string;
  username?: string;
  name: string;
  avatar: string;
  role: string;
  publicKeySpki: string | null;
  keyPair: CryptoKeyPair | null;
  isBiometricRegistered: boolean;
  isBiometricAuthenticated: boolean;
  biometricType: 'fingerprint' | 'face' | 'none';
  pinCode?: string;
  hasPinCode?: boolean;
  password?: string;
  telegramChatId?: string | null;
  friends?: string[];
  patternLock?: string | null;
  notificationPreferences?: {
    webPush: boolean;
    telegram: boolean;
  };
  allowDelayLock?: boolean;
  isOnline?: boolean;
  isFocused?: boolean;
  lastSeen?: number | null;
  hasCameraPermission?: boolean;
}

export interface EditorialArticle {
  id: string;
  title: string;
  category: string;
  time: string;
  author: string;
  summary: string;
  image: string;
  content: string;
}

export interface ActiveConversation {
  userId: string;
  messages: Message[];
}
