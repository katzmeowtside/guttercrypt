import fs from 'node:fs';
import { execSync } from 'node:child_process';
import {
  getVaultPath,
  getVaultFilePath,
  getMetaFilePath,
  getMemoryFilePath,
  readConfig,
  writeConfig,
  VAULT_FILE,
  META_FILE,
  MEMORY_FILE,
} from './config.js';

const GIST_API = 'https://api.github.com/gists';

export function getGitHubToken(dir) {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;

  // Check config file
  const config = readConfig(dir);
  if (config.githubToken) return config.githubToken;

  try {
    const token = execSync('gh auth token', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (token) return token;
  } catch {
    // gh CLI not available or not authenticated
  }

  return null;
}

export function getGistId(dir = process.cwd()) {
  const config = readConfig(dir);
  return config.gistId || null;
}

export function saveGistId(gistId, dir = process.cwd()) {
  const config = readConfig(dir);
  config.gistId = gistId;
  writeConfig(config, dir);
}

export async function pushToGist(dir = process.cwd()) {
  const token = getGitHubToken();
  if (!token) return { success: false, error: 'no_token' };

  const vaultPath = getVaultFilePath(dir);
  if (!fs.existsSync(vaultPath)) {
    return { success: false, error: 'no_vault' };
  }

  const files = {};

  // Always include vault.enc
  files[VAULT_FILE] = { content: fs.readFileSync(vaultPath, 'utf8') };

  // Include vault.meta if it exists
  const metaPath = getMetaFilePath(dir);
  if (fs.existsSync(metaPath)) {
    files[META_FILE] = { content: fs.readFileSync(metaPath, 'utf8') };
  }

  // Include memory.enc if it exists
  const memPath = getMemoryFilePath(dir);
  if (fs.existsSync(memPath)) {
    files[MEMORY_FILE] = { content: fs.readFileSync(memPath, 'utf8') };
  }

  const gistId = getGistId(dir);

  try {
    if (gistId) {
      // Update existing gist
      const res = await fetch(`${GIST_API}/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ files }),
      });

      if (res.status === 404) return { success: false, error: 'gist_not_found' };
      if (res.status === 401 || res.status === 403) return { success: false, error: 'auth_failed' };
      if (!res.ok) return { success: false, error: 'api_error', message: `HTTP ${res.status}` };

      const data = await res.json();
      return { success: true, gistId: data.id, gistUrl: data.html_url, created: false };
    } else {
      // Create new secret gist
      const res = await fetch(GIST_API, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          description: 'guttercrypt vault sync',
          public: false,
          files,
        }),
      });

      if (res.status === 401 || res.status === 403) return { success: false, error: 'auth_failed' };
      if (!res.ok) return { success: false, error: 'api_error', message: `HTTP ${res.status}` };

      const data = await res.json();
      saveGistId(data.id, dir);
      return { success: true, gistId: data.id, gistUrl: data.html_url, created: true };
    }
  } catch (err) {
    if (err.cause?.code === 'ENOTFOUND' || err.cause?.code === 'ECONNREFUSED') {
      return { success: false, error: 'network_error' };
    }
    return { success: false, error: 'network_error', message: err.message };
  }
}

export async function pullFromGist(dir = process.cwd()) {
  const token = getGitHubToken();
  if (!token) return { success: false, error: 'no_token' };

  const gistId = getGistId(dir);
  if (!gistId) return { success: false, error: 'no_gist_linked' };

  try {
    const res = await fetch(`${GIST_API}/${gistId}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 404) return { success: false, error: 'gist_not_found' };
    if (res.status === 401 || res.status === 403) return { success: false, error: 'auth_failed' };
    if (!res.ok) return { success: false, error: 'api_error', message: `HTTP ${res.status}` };

    const data = await res.json();
    const gistFiles = data.files || {};

    // Ensure .guttercrypt dir exists
    const vaultPath = getVaultPath(dir);
    if (!fs.existsSync(vaultPath)) {
      fs.mkdirSync(vaultPath, { recursive: true });
    }

    const filesUpdated = [];

    if (gistFiles[VAULT_FILE]) {
      fs.writeFileSync(getVaultFilePath(dir), gistFiles[VAULT_FILE].content, 'utf8');
      filesUpdated.push(VAULT_FILE);
    }

    if (gistFiles[META_FILE]) {
      fs.writeFileSync(getMetaFilePath(dir), gistFiles[META_FILE].content, 'utf8');
      filesUpdated.push(META_FILE);
    }

    if (gistFiles[MEMORY_FILE]) {
      fs.writeFileSync(getMemoryFilePath(dir), gistFiles[MEMORY_FILE].content, 'utf8');
      filesUpdated.push(MEMORY_FILE);
    }

    return { success: true, filesUpdated };
  } catch (err) {
    if (err.cause?.code === 'ENOTFOUND' || err.cause?.code === 'ECONNREFUSED') {
      return { success: false, error: 'network_error' };
    }
    return { success: false, error: 'network_error', message: err.message };
  }
}

export async function linkGist(gistId, dir = process.cwd()) {
  const token = getGitHubToken();
  if (!token) return { success: false, error: 'no_token' };

  try {
    const res = await fetch(`${GIST_API}/${gistId}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 404) return { success: false, error: 'gist_not_found' };
    if (res.status === 401 || res.status === 403) return { success: false, error: 'auth_failed' };
    if (!res.ok) return { success: false, error: 'api_error', message: `HTTP ${res.status}` };

    const data = await res.json();
    const gistFiles = data.files || {};

    if (!gistFiles[VAULT_FILE]) {
      return { success: false, error: 'not_a_vault_gist' };
    }

    // Ensure .guttercrypt dir exists
    const vaultPath = getVaultPath(dir);
    if (!fs.existsSync(vaultPath)) {
      fs.mkdirSync(vaultPath, { recursive: true });
    }

    saveGistId(gistId, dir);
    return { success: true, gistUrl: data.html_url };
  } catch (err) {
    if (err.cause?.code === 'ENOTFOUND' || err.cause?.code === 'ECONNREFUSED') {
      return { success: false, error: 'network_error' };
    }
    return { success: false, error: 'network_error', message: err.message };
  }
}
