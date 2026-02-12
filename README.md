# guttercrypt

Local secrets manager with KatBot personality. AES-256 encrypted vault for your `.env` files. No cloud, no subscriptions.

## Install

```bash
npm install -g guttercrypt
```

### Termux (Android)

```bash
pkg install nodejs-lts
npm install -g guttercrypt
```

## Usage

```bash
# Create a vault in your project
guttercrypt init

# Encrypt your .env file
guttercrypt store

# Encrypt a specific file
guttercrypt store .env.production

# List stored keys (no values shown)
guttercrypt list

# Restore .env from vault
guttercrypt inject

# Delete plaintext .env (vault keeps encrypted copy)
guttercrypt lock

# Restore .env from vault
guttercrypt unlock

# Destroy the vault completely
guttercrypt nuke

# Ask KatBot AI about secrets management
guttercrypt ask "what is the best way to manage API keys?"

# Easter egg
guttercrypt meow
```

## AI Chat (Optional)

The `ask` command uses Google Gemini for AI-powered answers in KatBot's voice. Set your API key:

```bash
export GEMINI_API_KEY=your-key-here
```

Install the optional dependency:

```bash
npm install @google/genai
```

## How It Works

- Creates a `.guttercrypt/` directory in your project
- Encrypts files with AES-256-GCM (authenticated encryption)
- Passphrase is used to derive a 256-bit key via PBKDF2 (100k iterations, SHA-512)
- Random IV and salt for each encryption
- Metadata file stores key names and timestamps (never values)

## Security

- All encryption happens locally on your machine
- No data leaves your device (except optional AI chat)
- Passphrases are never stored
- Uses Node.js built-in `crypto` module (no native dependencies)

## License

MIT
