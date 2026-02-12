import path from 'node:path';

export const VAULT_DIR = '.guttercrypt';
export const VAULT_FILE = 'vault.enc';
export const META_FILE = 'vault.meta';
export const CONFIG_FILE = 'config';
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
