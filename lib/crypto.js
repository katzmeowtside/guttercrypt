import crypto from 'node:crypto';
import {
  ALGORITHM,
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  IV_LENGTH,
  SALT_LENGTH,
} from './config.js';

export function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

const AUTH_TAG_LENGTH = 16;

export function encrypt(plaintext, passphrase) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // salt(32) + iv(16) + authTag(16) + ciphertext → single base64 string
  return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
}

export function decrypt(encryptedData, passphrase) {
  const buf = Buffer.from(encryptedData.trim(), 'base64');

  let offset = 0;
  const salt = buf.subarray(offset, offset += SALT_LENGTH);
  const iv = buf.subarray(offset, offset += IV_LENGTH);
  const authTag = buf.subarray(offset, offset += AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(offset);

  const key = deriveKey(passphrase, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
