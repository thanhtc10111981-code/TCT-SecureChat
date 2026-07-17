import { arrayBufferToBase64, base64ToArrayBuffer, isCryptoSupported } from './crypto';

// Derives an AES-GCM 256-bit key from a password using PBKDF2
async function deriveKeyFromPassword(password: string, salt: Uint8Array, iterations: number = 100000): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
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
    throw new Error('Mật khẩu giải mã khóa không đúng.');
  }
}

// Check if a string has the key sharing JSON format
export function isKeySharingJson(value: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null && 'spki' in parsed && 'encryptedPriv' in parsed;
    } catch {
      return false;
    }
  }
  return false;
}

// Encrypt Private Key PKCS#8 string using a user-specified password
export async function encryptPrivateKeyWithPassword(privateKeyBase64: string, password: string): Promise<string> {
  if (isCryptoSupported()) {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const aesKey = await deriveKeyFromPassword(password, salt, 100000);
      
      const encoder = new TextEncoder();
      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        aesKey,
        encoder.encode(privateKeyBase64)
      );
      
      return JSON.stringify({
        ciphertext: arrayBufferToBase64(ciphertextBuffer),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        iterations: 100000
      });
    } catch (e) {
      console.warn('Subtle crypto PBKDF2 encrypt failed, using software fallback:', e);
    }
  }
  // Fallback payload (mock format)
  return JSON.stringify({
    ciphertext: mockXOR(privateKeyBase64, password),
    salt: 'MOCK_SALT',
    iv: 'MOCK_IV',
    iterations: 0
  });
}

// Decrypt Private Key PKCS#8 string using a user-specified password
export async function decryptPrivateKeyWithPassword(encryptedDataJson: string, password: string): Promise<string> {
  try {
    const parsed = typeof encryptedDataJson === 'string' ? JSON.parse(encryptedDataJson) : encryptedDataJson;
    if (parsed && parsed.ciphertext) {
      if (parsed.iterations === 0 || parsed.salt === 'MOCK_SALT') {
        return mockXORDecrypt(parsed.ciphertext, password);
      }
      
      if (isCryptoSupported()) {
        try {
          const salt = new Uint8Array(base64ToArrayBuffer(parsed.salt));
          const iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
          const ciphertext = base64ToArrayBuffer(parsed.ciphertext);
          
          const aesKey = await deriveKeyFromPassword(password, salt, parsed.iterations || 100000);
          const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: iv
            },
            aesKey,
            ciphertext
          );
          return new TextDecoder().decode(decryptedBuffer);
        } catch (e) {
          console.warn('Subtle crypto decrypt failed, wrong password or invalid key:', e);
          throw new Error('Mật khẩu giải mã khóa không đúng.');
        }
      } else {
        throw new Error('Trình duyệt hiện tại không hỗ trợ WebCrypto để giải mã khóa.');
      }
    }
  } catch (err: any) {
    if (err.message === 'Mật khẩu giải mã khóa không đúng.') {
      throw err;
    }
    throw new Error('Mật khẩu giải mã khóa không đúng hoặc dữ liệu khóa bị lỗi.');
  }
  throw new Error('Dữ liệu khóa bí mật đã mã hóa không đúng định dạng.');
}
