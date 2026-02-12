# guttercrypt

Local secrets manager with KatBot personality. AES-256 encrypted vault for your `.env` files. Cloud sync via secret GitHub Gists. Encrypted KatBot memory.

## Install

```bash
npm install -g guttahcrypt
```

### Termux (Android)

```bash
pkg install nodejs-lts
npm install -g guttahcrypt
```

## Usage

```bash
# Create a vault in your project
guttahcrypt init

# Encrypt your .env file
guttahcrypt store

# Encrypt a specific file
guttahcrypt store .env.production

# List stored keys (no values shown)
guttahcrypt list

# Restore .env from vault
guttahcrypt inject

# Delete plaintext .env (vault keeps encrypted copy)
guttahcrypt lock

# Restore .env from vault
guttahcrypt unlock

# Destroy the vault completely
guttahcrypt nuke

# Ask KatBot AI about secrets management
guttahcrypt ask "what is the best way to manage API keys?"

# Easter egg
guttahcrypt meow
```

## Cloud Sync

Push and pull your encrypted vault across devices using a secret GitHub Gist. Your data is encrypted before it leaves your machine.

```bash
# Push vault to a new secret Gist (or update existing)
guttahcrypt push

# Pull vault from linked Gist
guttahcrypt pull

# Link to an existing Gist on a new device
guttahcrypt link <gist-id>
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
guttahcrypt push
# → creates secret Gist, prints Gist ID

# Device B — link and pull
guttahcrypt link <gist-id>
guttahcrypt pull
# → vault synced to new device
```

## KatBot Memory

Save notes and conversation history to KatBot's encrypted memory. Memory is included as context when you use `ask`.

```bash
# Save a note
guttahcrypt remember "always use separate API keys per environment"

# Show all stored memories
guttahcrypt recall

# Delete a note (interactive picker)
guttahcrypt forget
```

When memory exists, `ask` will prompt for your passphrase to load context. Conversations are automatically saved (capped at 20).

## AI Chat (Optional)

The `ask` command uses KatBot AI for snarky, helpful answers. Supports multiple providers — no extra dependencies needed (uses built-in `fetch`).

```bash
# Interactive setup — pick a provider, enter API key
guttahcrypt config
```

### Supported Providers

| Provider | Default Model | Env Var |
|----------|--------------|---------|
| Gemini | gemini-2.0-flash | `GEMINI_API_KEY` |
| Groq | llama-3.3-70b-versatile | `GROQ_API_KEY` |
| OpenAI | gpt-4o-mini | `OPENAI_API_KEY` |
| Custom | (you choose) | `AI_API_KEY` |

Custom supports any OpenAI-compatible API (Together, Mistral, Ollama, etc.).

You can also set keys via environment variables instead of `guttahcrypt config`.

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
