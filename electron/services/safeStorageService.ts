import { safeStorage } from 'electron';

const ENCRYPTED_PREFIX = 'encrypted:';
const PLAIN_PREFIX = 'plain:';

export function encryptString(plainText: string): string {
  if (!plainText) return '';
  if (safeStorage.isEncryptionAvailable()) {
    const buffer = safeStorage.encryptString(plainText);
    return ENCRYPTED_PREFIX + buffer.toString('hex');
  }
  return PLAIN_PREFIX + plainText;
}

export function decryptString(stored: string): string {
  if (!stored) return '';
  if (stored.startsWith(ENCRYPTED_PREFIX)) {
    const hex = stored.slice(ENCRYPTED_PREFIX.length);
    const buffer = Buffer.from(hex, 'hex');
    return safeStorage.decryptString(buffer);
  }
  if (stored.startsWith(PLAIN_PREFIX)) {
    return stored.slice(PLAIN_PREFIX.length);
  }
  // Legacy: no prefix means plain text (pre-safeStorage migration)
  return stored;
}

export function isEncrypted(stored: string): boolean {
  return stored.startsWith(ENCRYPTED_PREFIX);
}
