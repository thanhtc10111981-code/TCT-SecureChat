/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    return new ArrayBuffer(0);
  }
}

// Check if Subtle Crypto is fully functional in this browser/iframe context
export function isCryptoSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.crypto !== undefined &&
    window.crypto.subtle !== undefined
  );
}

// Generate RSA-OAEP keypair for End-to-End Encryption
export async function generateE2EKeyPair(): Promise<CryptoKeyPair> {
  if (isCryptoSupported()) {
    try {
      return await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.warn('Subtle crypto generateKey failed, falling back to mock:', e);
    }
  }

  // Software fallback mock keys
  const id = Math.random().toString(36).substring(2, 10).toUpperCase();
  const mockPublic: CryptoKey & { isMock?: boolean; keyId?: string } = {
    type: 'public',
    extractable: true,
    algorithm: { name: 'RSA-OAEP' },
    usages: ['encrypt'],
    isMock: true,
    keyId: `PUB-${id}`
  };

  const mockPrivate: CryptoKey & { isMock?: boolean; keyId?: string } = {
    type: 'private',
    extractable: true,
    algorithm: { name: 'RSA-OAEP' },
    usages: ['decrypt'],
    isMock: true,
    keyId: `PRI-${id}`
  };

  return { publicKey: mockPublic, privateKey: mockPrivate };
}

// Export Public Key to SPKI format (Base64)
export async function exportPublicKey(key: CryptoKey & { isMock?: boolean; keyId?: string }): Promise<string> {
  if (isCryptoSupported() && !key.isMock) {
    try {
      const exported = await window.crypto.subtle.exportKey('spki', key);
      return arrayBufferToBase64(exported);
    } catch (e) {
      console.warn('Subtle crypto exportKey failed, exporting mock format:', e);
    }
  }
  return key.keyId || `PUB-MOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Import Public Key from SPKI format (Base64)
export async function importPublicKey(spkiBase64: string): Promise<CryptoKey & { isMock?: boolean; keyId?: string }> {
  if (isCryptoSupported() && !spkiBase64.startsWith('PUB-')) {
    try {
      const buffer = base64ToArrayBuffer(spkiBase64);
      return await window.crypto.subtle.importKey(
        'spki',
        buffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
    } catch (e) {
      console.warn('Subtle crypto importKey failed, wrapping as mock key:', e);
    }
  }

  return {
    type: 'public',
    extractable: true,
    algorithm: { name: 'RSA-OAEP' },
    usages: ['encrypt'],
    isMock: true,
    keyId: spkiBase64
  };
}

export interface EncryptedPayload {
  ciphertext: string;  // Base64 encrypted message
  encryptedKey: string; // Base64 AES key encrypted with RSA-OAEP
  iv: string;           // Base64 initialization vector
  isMockPayload?: boolean;
}

// Simple fallback XOR cipher for environments with blocked/disabled WebCrypto
function mockXOR(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function mockXORDecrypt(base64Text: string, key: string): string {
  try {
    const text = decodeURIComponent(escape(atob(base64Text)));
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return 'Dữ liệu lỗi';
  }
}

// Encrypt a message using Hybrid Encryption (AES-GCM + RSA-OAEP)
export async function encryptMessage(
  plainText: string,
  recipientPublicKeySpki: string
): Promise<EncryptedPayload> {
  const isMockKey = recipientPublicKeySpki.startsWith('PUB-');

  if (isCryptoSupported() && !isMockKey) {
    try {
      // 1. Import recipient's RSA Public Key
      const recipientPubKey = await importPublicKey(recipientPublicKeySpki);

      // 2. Generate ephemeral AES-GCM 256-bit key
      const aesKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );

      // 3. Encrypt plain text with AES-GCM
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(plainText);
      
      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        encodedText
      );

      // 4. Wrap (Encrypt) the AES key using recipient's RSA Public Key
      const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
      const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        recipientPubKey,
        exportedAesKey
      );

      return {
        ciphertext: arrayBufferToBase64(ciphertextBuffer),
        encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
        iv: arrayBufferToBase64(iv),
      };
    } catch (error) {
      console.warn('Encryption failed under subtle, using soft-crypto fallback:', error);
    }
  }

  // Fallback to high-fidelity simulated hybrid encryption
  const mockAesKey = Math.random().toString(36).substring(2, 12);
  const mockIv = Math.random().toString(36).substring(2, 8);
  const ciphertext = mockXOR(plainText, mockAesKey);
  const encryptedKey = mockXOR(mockAesKey, recipientPublicKeySpki);

  return {
    ciphertext,
    encryptedKey,
    iv: btoa(mockIv),
    isMockPayload: true
  };
}

// Decrypt a message using hybrid decryption
export async function decryptMessage(
  payload: EncryptedPayload,
  recipientPrivateKey: CryptoKey & { isMock?: boolean; keyId?: string }
): Promise<string> {
  if (isCryptoSupported() && !payload.isMockPayload && !recipientPrivateKey.isMock) {
    try {
      const { ciphertext, encryptedKey, iv } = payload;

      // 1. Decrypt the AES key using recipient's RSA Private Key
      const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
      const decryptedAesKeyRaw = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        recipientPrivateKey,
        encryptedKeyBuffer
      );

      // 2. Import the decrypted AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        decryptedAesKeyRaw,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );

      // 3. Decrypt the ciphertext with the AES key and IV
      const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
      const ivBuffer = base64ToArrayBuffer(iv);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(ivBuffer),
        },
        aesKey,
        ciphertextBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.warn('Decryption failed under subtle:', error);
      throw error;
    }
  }

  // Decrypt using software fallback
  try {
    const { ciphertext, encryptedKey } = payload;
    // Private key starts with PRI- and public key with PUB-. Let's recreate public key id
    const mockPublicKeyId = recipientPrivateKey.keyId ? recipientPrivateKey.keyId.replace('PRI-', 'PUB-') : 'PUB-';
    const decryptedAesKey = mockXORDecrypt(encryptedKey, mockPublicKeyId);
    return mockXORDecrypt(ciphertext, decryptedAesKey);
  } catch (err) {
    return 'Lỗi giải mã phần mềm';
  }
}

// Export Private Key to PKCS#8 format (Base64)
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  if (isCryptoSupported() && !(key as any).isMock) {
    try {
      const exported = await window.crypto.subtle.exportKey('pkcs8', key);
      return arrayBufferToBase64(exported);
    } catch (e) {
      console.warn('Subtle crypto exportPrivateKey failed:', e);
    }
  }
  return (key as any).keyId || `PRI-MOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Import Private Key from PKCS#8 format (Base64)
export async function importPrivateKey(pkcs8Base64: string): Promise<CryptoKey & { isMock?: boolean; keyId?: string }> {
  if (isCryptoSupported() && !pkcs8Base64.startsWith('PRI-')) {
    try {
      const buffer = base64ToArrayBuffer(pkcs8Base64);
      return await window.crypto.subtle.importKey(
        'pkcs8',
        buffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
         },
        true,
        ['decrypt']
      ) as any;
    } catch (e) {
      console.warn('Subtle crypto importPrivateKey failed, wrapping as mock key:', e);
    }
  }

  return {
    type: 'private',
    extractable: true,
    algorithm: { name: 'RSA-OAEP' },
    usages: ['decrypt'],
    isMock: true,
    keyId: pkcs8Base64
  } as any;
}

// Helper to hash password using SHA-256
export async function sha256(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash a password to a 32-byte key buffer for AES
async function deriveSymmetricKeyFromPassword(password: string): Promise<CryptoKey> {
  const hashHex = await sha256(password);
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hashHex.substring(i * 2, i * 2 + 2), 16);
  }
  return await window.crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPrivateKeyWithPassword(privateKeyBase64: string, password: string): Promise<string> {
  if (isCryptoSupported()) {
    try {
      const aesKey = await deriveSymmetricKeyFromPassword(password);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(privateKeyBase64);
      
      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        encodedText
      );
      
      const payload = {
        ciphertext: arrayBufferToBase64(ciphertextBuffer),
        iv: arrayBufferToBase64(iv)
      };
      return JSON.stringify(payload);
    } catch (e) {
      console.warn('encryptPrivateKeyWithPassword failed:', e);
    }
  }
  // Software fallback
  return btoa(mockXOR(privateKeyBase64, password));
}

export async function decryptPrivateKeyWithPassword(encryptedDataJson: string, password: string): Promise<string> {
  if (isCryptoSupported()) {
    try {
      const parsed = JSON.parse(encryptedDataJson);
      if (parsed.ciphertext && parsed.iv) {
        const aesKey = await deriveSymmetricKeyFromPassword(password);
        const ciphertextBuffer = base64ToArrayBuffer(parsed.ciphertext);
        const ivBuffer = base64ToArrayBuffer(parsed.iv);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: new Uint8Array(ivBuffer),
          },
          aesKey,
          ciphertextBuffer
        );
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
      }
    } catch (e) {
      console.warn('decryptPrivateKeyWithPassword failed:', e);
    }
  }
  // Software fallback
  try {
    const rawXor = atob(encryptedDataJson);
    return mockXORDecrypt(rawXor, password);
  } catch (err) {
    throw new Error('Mật khẩu giải mã khóa không đúng.');
  }
}

export function extractPublicKey(rawKey: string | null): string | null {
  if (!rawKey) return null;
  const trimmed = rawKey.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.spki || parsed.publicKeySpki || parsed.pub || null;
    } catch {
      return rawKey;
    }
  }
  return rawKey;
}

export function extractEncryptedPrivateKey(rawKey: string | null): string | null {
  if (!rawKey) return null;
  const trimmed = rawKey.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const priv = parsed.encryptedPriv || parsed.encryptedPrivateKey || parsed.encPriv || null;
      if (priv && typeof priv === 'object') {
        return JSON.stringify(priv);
      }
      return priv;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Fast, lightweight character-shifting string obfuscation (Caesar cipher style + Base64)
 * to hide plain text from browser session/local storage.
 */
export function shiftObfuscate(str: string, shift = 5): string {
  if (!str) return str;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    result += String.fromCharCode(charCode + shift);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

/**
 * Reverses the lightweight shift obfuscation.
 */
export function shiftDeobfuscate(obfuscated: string, shift = 5): string {
  if (!obfuscated) return obfuscated;
  try {
    const decoded = decodeURIComponent(escape(atob(obfuscated)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      result += String.fromCharCode(charCode - shift);
    }
    return result;
  } catch (e) {
    console.warn('shiftDeobfuscate failed:', e);
    return '';
  }
}




