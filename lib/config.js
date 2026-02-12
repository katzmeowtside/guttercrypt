import fs from 'node:fs';
import path from 'node:path';

export const VAULT_DIR = '.guttercrypt';
export const VAULT_FILE = 'vault.enc';
export const META_FILE = 'vault.meta';
export const CONFIG_FILE = 'config';
export const MEMORY_FILE = 'memory.enc';
export const MAX_CONVERSATIONS = 20;
export const PBKDF2_ITERATIONS = 100000;
export const ALGORITHM = 'aes-256-gcm';
export const KEY_LENGTH = 32;
export const IV_LENGTH = 16;
export const SALT_LENGTH = 32;

export function getVaultPath(dir = process.cwd()) {
  return path.join(dir, VAULT_DIR);
}

export function getVaultFilePath(dir = process.cwd()) {
  return path.join(dir, VAULT_DIR, VAULT_FILE);
}

export function getMetaFilePath(dir = process.cwd()) {
  return path.join(dir, VAULT_DIR, META_FILE);
}

export function getConfigFilePath(dir = process.cwd()) {
  return path.join(dir, VAULT_DIR, CONFIG_FILE);
}

export function getMemoryFilePath(dir = process.cwd()) {
  return path.join(dir, VAULT_DIR, MEMORY_FILE);
}

export function readConfig(dir = process.cwd()) {
  const configPath = getConfigFilePath(dir);
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

export function writeConfig(config, dir = process.cwd()) {
  const vaultPath = getVaultPath(dir);
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }
  fs.writeFileSync(getConfigFilePath(dir), JSON.stringify(config, null, 2), 'utf8');
}
