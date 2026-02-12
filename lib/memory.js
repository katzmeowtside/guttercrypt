import fs from 'node:fs';
import { encrypt, decrypt } from './crypto.js';
import { getMemoryFilePath, MAX_CONVERSATIONS } from './config.js';

function emptyMemory() {
  return { notes: [], conversations: [] };
}

export function memoryExists(dir = process.cwd()) {
  return fs.existsSync(getMemoryFilePath(dir));
}

export function loadMemory(passphrase, dir = process.cwd()) {
  const memPath = getMemoryFilePath(dir);
  if (!fs.existsSync(memPath)) {
    return { success: true, memory: emptyMemory() };
  }

  try {
    const encryptedData = fs.readFileSync(memPath, 'utf8');
    const plaintext = decrypt(encryptedData, passphrase);
    const memory = JSON.parse(plaintext);
    return { success: true, memory };
  } catch {
    return { success: false, error: 'wrong_passphrase' };
  }
}

export function saveMemory(memory, passphrase, dir = process.cwd()) {
  const plaintext = JSON.stringify(memory);
  const encrypted = encrypt(plaintext, passphrase);
  fs.writeFileSync(getMemoryFilePath(dir), encrypted, 'utf8');
  return { success: true };
}

export function addNote(text, passphrase, dir = process.cwd()) {
  const result = loadMemory(passphrase, dir);
  if (!result.success) return result;

  result.memory.notes.push({ text, createdAt: new Date().toISOString() });
  saveMemory(result.memory, passphrase, dir);
  return { success: true };
}

export function removeNote(index, passphrase, dir = process.cwd()) {
  const result = loadMemory(passphrase, dir);
  if (!result.success) return result;

  if (index < 0 || index >= result.memory.notes.length) {
    return { success: false, error: 'invalid_index' };
  }

  result.memory.notes.splice(index, 1);
  saveMemory(result.memory, passphrase, dir);
  return { success: true };
}

export function getNotes(passphrase, dir = process.cwd()) {
  const result = loadMemory(passphrase, dir);
  if (!result.success) return result;
  return { success: true, notes: result.memory.notes };
}

export function addConversation(question, answer, passphrase, dir = process.cwd()) {
  const result = loadMemory(passphrase, dir);
  if (!result.success) return result;

  result.memory.conversations.push({
    question,
    answer,
    askedAt: new Date().toISOString(),
  });

  // trim to MAX_CONVERSATIONS
  if (result.memory.conversations.length > MAX_CONVERSATIONS) {
    result.memory.conversations = result.memory.conversations.slice(-MAX_CONVERSATIONS);
  }

  saveMemory(result.memory, passphrase, dir);
  return { success: true };
}

export function buildMemoryPrompt(memory) {
  let prompt = '';

  if (memory.notes.length > 0) {
    prompt += '\n\n--- USER NOTES (things the user wants you to remember) ---\n';
    memory.notes.forEach((note, i) => {
      prompt += `${i + 1}. ${note.text}\n`;
    });
  }

  if (memory.conversations.length > 0) {
    prompt += '\n\n--- RECENT CONVERSATION HISTORY ---\n';
    memory.conversations.forEach((conv) => {
      prompt += `Q: ${conv.question}\nA: ${conv.answer}\n\n`;
    });
  }

  return prompt;
}
