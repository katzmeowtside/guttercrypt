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

    console.log(katbot.aiThinking());
    const result = await askKatBot(question);

    if (result.success) {
      console.log(katbot.aiResponse(result.response));
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

// --- meow ---
program
  .command('meow')
  .description('Easter egg')
  .action(() => {
    console.log(katbot.meow());
  });

program.parse();
