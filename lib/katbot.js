import chalk from 'chalk';

const pink = chalk.hex('#FF69B4');
const neon = chalk.hex('#39FF14');
const skull = chalk.hex('#FF4444');
const warn = chalk.hex('#FFD700');

export const katbot = {
  // Init
  initSuccess: () =>
    neon(`\n  🐱 mrrp. vault created. your secrets have a home now. 😈\n`),
  initAlreadyExists: () =>
    warn(`\n  ⚠️  vault already exists here. you want me to nuke it? (guttercrypt nuke)\n`),

  // Store
  storeSuccess: (count) =>
    pink(`\n  🔐 swallowed ${count} secret${count !== 1 ? 's' : ''} into the vault. encrypted. sealed. mine. 🖤\n`),
  storeNoFile: (file) =>
    skull(`\n  ❌ can't find '${file}'. give me something to eat, meatbag.\n`),

  // Inject
  injectSuccess: (file) =>
    neon(`\n  💉 secrets injected into ${file} — handle with care, meatbag.\n`),

  // List
  listHeader: () =>
    pink(`\n  📋 here's what's in the vault (keys only, i'm not stupid):\n`),
  listKey: (key) =>
    chalk.gray(`     • ${key}`),
  listEmpty: () =>
    warn(`\n  📋 vault is empty. nothing to see here. feed me secrets.\n`),

  // Lock
  lockSuccess: () =>
    neon(`\n  🔒 vault sealed. .env deleted. your secrets are underground now. 💀\n`),
  lockNoFile: (file) =>
    warn(`\n  ⚠️  '${file}' doesn't exist. nothing to lock. maybe it's already sealed?\n`),

  // Unlock
  unlockSuccess: (file) =>
    neon(`\n  🔓 vault cracked open. ${file} restored. don't do anything dumb with it.\n`),

  // Nuke
  nukeConfirm: () =>
    skull(`\n  💀 you sure? this is scorched earth. type 'burn it down' to confirm.\n`),
  nukeSuccess: () =>
    skull(`\n  🔥 vault obliterated. nothing remains. meow.\n`),
  nukeCancelled: () =>
    neon(`\n  🐱 smart choice. vault lives another day.\n`),

  // Errors
  wrongPassphrase: () =>
    skull(`\n  ❌ wrong passphrase. nice try though. 😒\n`),
  noVault: () =>
    skull(`\n  ❌ no vault here. run 'guttercrypt init' first, genius.\n`),
  genericError: (msg) =>
    skull(`\n  ❌ ${msg}\n`),

  // AI
  aiNoKey: () =>
    warn(`\n  🐱 KatBot's brain isn't connected. set GEMINI_API_KEY to wake her up.\n`),
  aiThinking: () =>
    pink(`\n  🐱 *thinking*...\n`),
  aiResponse: (text) =>
    neon(`\n  🐱 ${text}\n`),
  aiError: (msg) =>
    skull(`\n  ❌ KatBot's brain glitched: ${msg}\n`),

  // Passphrase prompt
  passphrasePrompt: () => '🔑 passphrase (don\'t forget it, i won\'t help you): ',
  passphraseConfirm: () => '🔑 confirm passphrase: ',
  passphraseMismatch: () =>
    skull(`\n  ❌ passphrases don't match. try again, butterfingers.\n`),

  // Meow easter egg
  meow: () => {
    const meows = [
      `\n  🐱 mrrrrrrp.\n`,
      `\n  🐱 *knocks your secrets off the table* meow.\n`,
      `\n  🐱 pspspsps? ...no. i call the shots here.\n`,
      `\n  🐱 meow. now encrypt something, i'm bored.\n`,
      `\n  🐱 *hisses at plaintext* disgusting.\n`,
      `\n  🐱 you came here just for this? ...respect.\n`,
    ];
    const cat = chalk.hex('#FF69B4')(`
      /\\_/\\
     ( o.o )
      > ^ <
     /|   |\\
    (_|   |_)
  `);
    const msg = meows[Math.floor(Math.random() * meows.length)];
    return pink(msg) + cat;
  },

  // Banner
  banner: () =>
    pink(`
   ░██████╗░██╗░░░██╗████████╗████████╗███████╗██████╗░░█████╗░██████╗░██╗░░░██╗██████╗░████████╗
   ██╔════╝░██║░░░██║╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗╚██╗░██╔╝██╔══██╗╚══██╔══╝
   ██║░░██╗░██║░░░██║░░░██║░░░░░░██║░░░█████╗░░██████╔╝██║░░╚═╝██████╔╝░╚████╔╝░██████╔╝░░░██║░░░
   ██║░░╚██╗██║░░░██║░░░██║░░░░░░██║░░░██╔══╝░░██╔══██╗██║░░██╗██╔══██╗░░╚██╔╝░░██╔═══╝░░░░██║░░░
   ╚██████╔╝╚██████╔╝░░░██║░░░░░░██║░░░███████╗██║░░██║╚█████╔╝██║░░██║░░░██║░░░██║░░░░░░░░██║░░░
   ░╚═════╝░░╚═════╝░░░░╚═╝░░░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝░╚════╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░░░░░░╚═╝░░░
  `) + neon(`   🐱 local secrets manager — no cloud, no bs\n`),
};
