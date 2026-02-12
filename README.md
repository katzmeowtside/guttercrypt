# guttercrypt

Local secrets manager with KatBot personality. AES-256 encrypted vault for your `.env` files. Cloud sync via secret GitHub Gists. Encrypted KatBot memory.

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

## Cloud Sync

Push and pull your encrypted vault across devices using a secret GitHub Gist. Your data is encrypted before it leaves your machine.

```bash
# Push vault to a new secret Gist (or update existing)
guttercrypt push

# Pull vault from linked Gist
guttercrypt pull

# Link to an existing Gist on a new device
guttercrypt link <gist-id>
```

### GitHub Token Setup

Sync needs a GitHub token with `gist` scope. Pick one:

```bash
# Option 1: Environment variable
export GITHUB_TOKEN=ghp_your_token_here

# Option 2: GH_TOKEN also works
export GH_TOKEN=ghp_your_token_here

# Option 3: GitHub CLI (auto-detected)
gh auth login
```

### Cross-Device Workflow

```bash
# Device A — push your vault
guttercrypt push
# → creates secret Gist, prints Gist ID

# Device B — link and pull
guttercrypt link <gist-id>
guttercrypt pull
# → vault synced to new device
```

## KatBot Memory

Save notes and conversation history to KatBot's encrypted memory. Memory is included as context when you use `ask`.

```bash
# Save a note
guttercrypt remember "always use separate API keys per environment"

# Show all stored memories
guttercrypt recall

# Delete a note (interactive picker)
guttercrypt forget
```

When memory exists, `ask` will prompt for your passphrase to load context. Conversations are automatically saved (capped at 20).

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
- Cloud sync pushes already-encrypted blobs to a secret Gist (last-write-wins)
- Memory is encrypted with the same passphrase and syncs with the vault

## Security

- All encryption happens locally on your machine
- No plaintext data leaves your device
- Gist data is encrypted before upload — GitHub sees only ciphertext
- Passphrases are never stored
- Uses Node.js built-in `crypto` module (no native dependencies)

## License

MIT
