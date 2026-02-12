#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { katbot } from '../lib/katbot.js';
import {
  createVault,
  storeSecrets,
  injectSecrets,
  listKeys,
  lockVault,
  unlockVault,
  nukeVault,
  vaultExists,
} from '../lib/vault.js';

const program = new Command();

program
  .name('guttercrypt')
  .description('🐱 local secrets manager — no cloud, no bs')
  .version('1.0.0')
  .addHelpText('before', katbot.banner());

// --- init ---
program
  .command('init')
  .description('Create encrypted vault in current project')
  .action(() => {
    if (vaultExists()) {
      console.log(katbot.initAlreadyExists());
      return;
    }
    const created = createVault();
    if (created) {
      console.log(katbot.initSuccess());
    } else {
      console.log(katbot.initAlreadyExists());
    }
  });

// --- store ---
program
  .command('store [file]')
  .description('Encrypt a file into the vault (default: .env)')
  .action(async (file = '.env') => {
    if (!vaultExists()) {
      console.log(katbot.noVault());
      return;
    }

    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'password',
        name: 'confirm',
        message: katbot.passphraseConfirm(),
        mask: '*',
      },
    ]);

    if (passphrase !== confirm) {
      console.log(katbot.passphraseMismatch());
      return;
    }

    const result = storeSecrets(file, passphrase);
    if (result.success) {
      console.log(katbot.storeSuccess(result.keyCount));
    } else if (result.error === 'file_not_found') {
      console.log(katbot.storeNoFile(file));
    } else {
      console.log(katbot.genericError('something went wrong storing secrets.'));
    }
  });

// --- inject ---
program
  .command('inject [file]')
  .description('Decrypt and restore file from vault (default: .env)')
  .action(async (file = '.env') => {
    if (!vaultExists()) {
      console.log(katbot.noVault());
      return;
    }

    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const result = injectSecrets(file, passphrase);
    if (result.success) {
      console.log(katbot.injectSuccess(file));
    } else if (result.error === 'wrong_passphrase') {
      console.log(katbot.wrongPassphrase());
    } else {
      console.log(katbot.noVault());
    }
  });

// --- list ---
program
  .command('list')
  .description('Show stored keys (names only, no values)')
  .action(async () => {
    if (!vaultExists()) {
      console.log(katbot.noVault());
      return;
    }

    // Try meta file first (no passphrase needed)
    const result = listKeys(null);
    if (result.success) {
      if (result.keys.length === 0) {
        console.log(katbot.listEmpty());
      } else {
        console.log(katbot.listHeader());
        result.keys.forEach((key) => console.log(katbot.listKey(key)));
        console.log('');
      }
      return;
    }

    // Fallback: need passphrase to decrypt
    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const decryptResult = listKeys(passphrase);
    if (decryptResult.success) {
      if (decryptResult.keys.length === 0) {
        console.log(katbot.listEmpty());
      } else {
        console.log(katbot.listHeader());
        decryptResult.keys.forEach((key) => console.log(katbot.listKey(key)));
        console.log('');
      }
    } else if (decryptResult.error === 'wrong_passphrase') {
      console.log(katbot.wrongPassphrase());
    } else {
      console.log(katbot.noVault());
    }
  });

// --- lock ---
program
  .command('lock [file]')
  .description('Seal the vault (delete plaintext file)')
  .action((file = '.env') => {
    if (!vaultExists()) {
      console.log(katbot.noVault());
      return;
    }

    const result = lockVault(file);
    if (result.success) {
      console.log(katbot.lockSuccess());
    } else if (result.error === 'file_not_found') {
      console.log(katbot.lockNoFile(file));
    } else {
      console.log(katbot.noVault());
    }
  });

// --- unlock ---
program
  .command('unlock [file]')
  .description('Unseal vault (decrypt file back to disk)')
  .action(async (file = '.env') => {
    if (!vaultExists()) {
      console.log(katbot.noVault());
      return;
    }

    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const result = unlockVault(file, passphrase);
    if (result.success) {
      console.log(katbot.unlockSuccess(file));
    } else if (result.error === 'wrong_passphrase') {
      console.log(katbot.wrongPassphrase());
    } else {
      console.log(katbot.noVault());
    }
  });

// --- nuke ---
program
  .command('nuke')
  .description('Destroy vault completely')
  .action(async () => {
    if (!vaultExists()) {
      console.log(katbot.noVault());
      return;
    }

    console.log(katbot.nukeConfirm());

    const { confirmation } = await inquirer.prompt([
      {
        type: 'input',
        name: 'confirmation',
        message: '🔥 ',
      },
    ]);

    if (confirmation.trim().toLowerCase() === 'burn it down') {
      const result = nukeVault();
      if (result.success) {
        console.log(katbot.nukeSuccess());
      } else {
        console.log(katbot.genericError('nuke failed. vault is stubborn.'));
      }
    } else {
      console.log(katbot.nukeCancelled());
    }
  });

// --- ask ---
program
  .command('ask <question...>')
  .description('Ask KatBot AI about secrets/env management')
  .action(async (questionParts) => {
    const question = questionParts.join(' ');
    const { askKatBot } = await import('../lib/ai.js');
    const { memoryExists, loadMemory, buildMemoryPrompt, addConversation } = await import('../lib/memory.js');

    let memoryContext = '';
    let passphrase = null;

    if (memoryExists()) {
      const { passphrase: pp } = await inquirer.prompt([
        {
          type: 'password',
          name: 'passphrase',
          message: katbot.passphrasePrompt(),
          mask: '*',
        },
      ]);
      passphrase = pp;

      const memResult = loadMemory(passphrase);
      if (memResult.success) {
        memoryContext = buildMemoryPrompt(memResult.memory);
      }
      // if wrong passphrase, still ask without context
    }

    console.log(katbot.aiThinking());
    const result = await askKatBot(question, memoryContext);

    if (result.success) {
      console.log(katbot.aiResponse(result.response));
      // save conversation if we have a valid passphrase
      if (passphrase) {
        try {
          addConversation(question, result.response, passphrase);
        } catch {
          // silently fail — don't break the ask flow
        }
      }
    } else if (result.error === 'no_api_key') {
      console.log(katbot.aiNoKey());
    } else if (result.error === 'no_module') {
      console.log(katbot.genericError(
        'optional dependency @google/genai not installed. run: npm install @google/genai'
      ));
    } else {
      console.log(katbot.aiError(result.message || 'unknown error'));
    }
  });

// --- push ---
program
  .command('push')
  .description('Push encrypted vault + memory to GitHub Gist')
  .action(async () => {
    if (!vaultExists()) {
      console.log(katbot.pushNoVault());
      return;
    }

    const { pushToGist } = await import('../lib/sync.js');
    const result = await pushToGist();

    if (result.success) {
      if (result.created) {
        console.log(katbot.pushCreated(result.gistUrl));
      } else {
        console.log(katbot.pushUpdated(result.gistUrl));
      }
    } else if (result.error === 'no_token') {
      console.log(katbot.pushNoToken());
    } else if (result.error === 'gist_not_found') {
      console.log(katbot.syncGistNotFound());
    } else if (result.error === 'auth_failed') {
      console.log(katbot.syncAuthFailed());
    } else if (result.error === 'network_error') {
      console.log(katbot.syncNetworkError());
    } else {
      console.log(katbot.syncApiError(result.message || 'unknown error'));
    }
  });

// --- pull ---
program
  .command('pull')
  .description('Pull encrypted vault + memory from GitHub Gist')
  .action(async () => {
    const { pullFromGist } = await import('../lib/sync.js');
    const result = await pullFromGist();

    if (result.success) {
      if (result.filesUpdated.length > 0) {
        console.log(katbot.pullSuccess(result.filesUpdated));
      } else {
        console.log(katbot.pullEmpty());
      }
    } else if (result.error === 'no_token') {
      console.log(katbot.pushNoToken());
    } else if (result.error === 'no_gist_linked') {
      console.log(katbot.pullNoGist());
    } else if (result.error === 'gist_not_found') {
      console.log(katbot.syncGistNotFound());
    } else if (result.error === 'auth_failed') {
      console.log(katbot.syncAuthFailed());
    } else if (result.error === 'network_error') {
      console.log(katbot.syncNetworkError());
    } else {
      console.log(katbot.syncApiError(result.message || 'unknown error'));
    }
  });

// --- link ---
program
  .command('link <gist-id>')
  .description('Link to an existing Gist for sync')
  .action(async (gistId) => {
    const { linkGist } = await import('../lib/sync.js');
    const result = await linkGist(gistId);

    if (result.success) {
      console.log(katbot.linkSuccess(result.gistUrl));
    } else if (result.error === 'no_token') {
      console.log(katbot.pushNoToken());
    } else if (result.error === 'not_a_vault_gist') {
      console.log(katbot.linkNotVault());
    } else if (result.error === 'gist_not_found') {
      console.log(katbot.syncGistNotFound());
    } else if (result.error === 'auth_failed') {
      console.log(katbot.syncAuthFailed());
    } else if (result.error === 'network_error') {
      console.log(katbot.syncNetworkError());
    } else {
      console.log(katbot.syncApiError(result.message || 'unknown error'));
    }
  });

// --- remember ---
program
  .command('remember <note...>')
  .description('Save a note to KatBot\'s encrypted memory')
  .action(async (noteParts) => {
    const note = noteParts.join(' ');
    const { addNote } = await import('../lib/memory.js');

    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const result = addNote(note, passphrase);
    if (result.success) {
      console.log(katbot.rememberSuccess());
    } else if (result.error === 'wrong_passphrase') {
      console.log(katbot.wrongPassphrase());
    } else {
      console.log(katbot.genericError('failed to save note.'));
    }
  });

// --- forget ---
program
  .command('forget')
  .description('Interactive picker to delete a memory')
  .action(async () => {
    const { getNotes, removeNote } = await import('../lib/memory.js');

    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const notesResult = getNotes(passphrase);
    if (!notesResult.success) {
      console.log(katbot.wrongPassphrase());
      return;
    }

    if (notesResult.notes.length === 0) {
      console.log(katbot.forgetEmpty());
      return;
    }

    const choices = notesResult.notes.map((n, i) => ({
      name: `${i + 1}. ${n.text}`,
      value: i,
    }));
    choices.push({ name: '(cancel)', value: -1 });

    const { index } = await inquirer.prompt([
      {
        type: 'list',
        name: 'index',
        message: 'which note should i forget?',
        choices,
      },
    ]);

    if (index === -1) {
      console.log(katbot.forgetCancelled());
      return;
    }

    const result = removeNote(index, passphrase);
    if (result.success) {
      console.log(katbot.forgetSuccess());
    } else {
      console.log(katbot.genericError('failed to forget. the memory haunts me.'));
    }
  });

// --- recall ---
program
  .command('recall')
  .description('Show all stored memories')
  .action(async () => {
    const { loadMemory } = await import('../lib/memory.js');

    const { passphrase } = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: katbot.passphrasePrompt(),
        mask: '*',
      },
    ]);

    const result = loadMemory(passphrase);
    if (!result.success) {
      console.log(katbot.wrongPassphrase());
      return;
    }

    const { notes, conversations } = result.memory;

    if (notes.length === 0 && conversations.length === 0) {
      console.log(katbot.recallEmpty());
      return;
    }

    if (notes.length > 0) {
      console.log(katbot.recallHeader());
      notes.forEach((n, i) => {
        const date = new Date(n.createdAt).toLocaleDateString();
        console.log(katbot.recallNote(i, n.text, date));
      });
    }

    if (conversations.length > 0) {
      console.log(katbot.recallConversations(conversations.length));
    }

    console.log('');
  });

// --- meow ---
program
  .command('meow')
  .description('Easter egg')
  .action(() => {
    console.log(katbot.meow());
  });

program.parse();
