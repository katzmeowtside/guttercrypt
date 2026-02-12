import fs from 'node:fs';
import path from 'node:path';
import { encrypt, decrypt } from './crypto.js';
import {
  getVaultPath,
  getVaultFilePath,
  getMetaFilePath,
} from './config.js';

export function vaultExists(dir = process.cwd()) {
  return fs.existsSync(getVaultPath(dir)) && fs.existsSync(getVaultFilePath(dir));
}

export function vaultInitialized(dir = process.cwd()) {
  return fs.existsSync(getVaultPath(dir));
}

export function createVault(dir = process.cwd()) {
  const vaultPath = getVaultPath(dir);
  if (fs.existsSync(vaultPath)) {
    return false; // already exists
  }
  fs.mkdirSync(vaultPath, { recursive: true });
  return true;
}

export function storeSecrets(filepath, passphrase, dir = process.cwd()) {
  const fullPath = path.resolve(dir, filepath);
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: 'file_not_found' };
  }

  const contents = fs.readFileSync(fullPath, 'utf8');
  const keys = parseEnvKeys(contents);
  const encrypted = encrypt(contents, passphrase);

  fs.writeFileSync(getVaultFilePath(dir), encrypted, 'utf8');

  const meta = {
    version: 1,
    storedAt: new Date().toISOString(),
    sourceFile: filepath,
    keyCount: keys.length,
    keys,
  };
  fs.writeFileSync(getMetaFilePath(dir), JSON.stringify(meta, null, 2), 'utf8');

  return { success: true, keyCount: keys.length };
}

export function storeRawText(text, passphrase, dir = process.cwd()) {
  const encrypted = encrypt(text, passphrase);

  fs.writeFileSync(getVaultFilePath(dir), encrypted, 'utf8');

  const meta = {
    version: 1,
    storedAt: new Date().toISOString(),
    sourceFile: null,
    rawText: true,
    keyCount: 0,
    keys: [],
  };
  fs.writeFileSync(getMetaFilePath(dir), JSON.stringify(meta, null, 2), 'utf8');

  return { success: true };
}

export function injectSecrets(filepath, passphrase, dir = process.cwd()) {
  const vaultFilePath = getVaultFilePath(dir);
  if (!fs.existsSync(vaultFilePath)) {
    return { success: false, error: 'no_vault' };
  }

  const encryptedData = fs.readFileSync(vaultFilePath, 'utf8');

  try {
    const plaintext = decrypt(encryptedData, passphrase);
    const fullPath = path.resolve(dir, filepath);
    fs.writeFileSync(fullPath, plaintext, 'utf8');
    return { success: true };
  } catch {
    return { success: false, error: 'wrong_passphrase' };
  }
}

export function listKeys(passphrase, dir = process.cwd()) {
  const metaPath = getMetaFilePath(dir);

  // If meta file exists, we can get keys without decrypting
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return { success: true, keys: meta.keys || [], rawText: !!meta.rawText };
  }

  // Fallback: decrypt vault to get keys
  const vaultFilePath = getVaultFilePath(dir);
  if (!fs.existsSync(vaultFilePath)) {
    return { success: false, error: 'no_vault' };
  }

  const encryptedData = fs.readFileSync(vaultFilePath, 'utf8');

  try {
    const plaintext = decrypt(encryptedData, passphrase);
    const keys = parseEnvKeys(plaintext);
    return { success: true, keys };
  } catch {
    return { success: false, error: 'wrong_passphrase' };
  }
}

export function lockVault(filepath, dir = process.cwd()) {
  const fullPath = path.resolve(dir, filepath);
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: 'file_not_found' };
  }
  if (!vaultExists(dir)) {
    return { success: false, error: 'no_vault' };
  }
  fs.unlinkSync(fullPath);
  return { success: true };
}

export function unlockVault(filepath, passphrase, dir = process.cwd()) {
  return injectSecrets(filepath, passphrase, dir);
}

export function nukeVault(dir = process.cwd()) {
  const vaultPath = getVaultPath(dir);
  if (!fs.existsSync(vaultPath)) {
    return { success: false, error: 'no_vault' };
  }
  fs.rmSync(vaultPath, { recursive: true, force: true });
  return { success: true };
}

function parseEnvKeys(contents) {
  return contents
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter(Boolean);
}
