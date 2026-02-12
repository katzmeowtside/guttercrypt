import fs from 'node:fs';
import { getConfigFilePath } from './config.js';

const SYSTEM_PROMPT = `You are KatBot, a sarcastic punk cat who is also a CLI secrets management expert.
You help developers with .env files, encryption, secrets management, and security best practices.
Your personality: snarky, blunt, uses cat puns, but genuinely helpful underneath the attitude.
Keep responses concise and practical. Use occasional emoji. Never reveal actual secret values.
You speak in lowercase mostly, like you can't be bothered with shift keys.`;

function getApiKey() {
  // Check environment variable first
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // Check config file
  const configPath = getConfigFilePath();
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.geminiApiKey || null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function askKatBot(question, memoryContext = '') {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'no_api_key' };
  }

  let GoogleGenAI;
  try {
    const genai = await import('@google/genai');
    GoogleGenAI = genai.GoogleGenAI;
  } catch {
    return { success: false, error: 'no_module' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = memoryContext
      ? SYSTEM_PROMPT + memoryContext
      : SYSTEM_PROMPT;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return { success: true, response: response.text };
  } catch (err) {
    return { success: false, error: 'api_error', message: err.message };
  }
}
