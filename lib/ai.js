import { readConfig } from './config.js';

const SYSTEM_PROMPT = `You are KatBot, a sarcastic punk cat who is also a CLI secrets management expert.
You help developers with .env files, encryption, secrets management, and security best practices.
Your personality: snarky, blunt, uses cat puns, but genuinely helpful underneath the attitude.
Keep responses concise and practical. Use occasional emoji. Never reveal actual secret values.
You speak in lowercase mostly, like you can't be bothered with shift keys.`;

export const PROVIDERS = {
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    envVar: 'GEMINI_API_KEY',
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    envVar: 'GROQ_API_KEY',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    envVar: 'OPENAI_API_KEY',
  },
};

function resolveProvider(dir) {
  const config = readConfig(dir);
  const provider = config.provider || 'gemini';
  const preset = PROVIDERS[provider];

  // API key: provider env var → generic env var → config
  let apiKey = null;
  if (preset) {
    apiKey = process.env[preset.envVar] || process.env.AI_API_KEY || config.apiKey || null;
  } else {
    apiKey = process.env.AI_API_KEY || config.apiKey || null;
  }

  const baseUrl = config.baseUrl || (preset ? preset.baseUrl : null);
  const model = config.model || (preset ? preset.defaultModel : null);

  return { apiKey, baseUrl, model };
}

export async function askKatBot(question, memoryContext = '') {
  const { apiKey, baseUrl, model } = resolveProvider();

  if (!apiKey) {
    return { success: false, error: 'no_api_key' };
  }

  if (!baseUrl || !model) {
    return { success: false, error: 'no_provider', message: 'run guttahcrypt config to set up an AI provider' };
  }

  const systemPrompt = memoryContext
    ? SYSTEM_PROMPT + memoryContext
    : SYSTEM_PROMPT;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      }),
    });

    if (res.status === 401 || res.status === 403) {
      return { success: false, error: 'auth_failed', message: 'invalid API key' };
    }

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: 'api_error', message: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return { success: false, error: 'api_error', message: 'empty response from AI' };
    }

    return { success: true, response: text };
  } catch (err) {
    if (err.cause?.code === 'ENOTFOUND' || err.cause?.code === 'ECONNREFUSED') {
      return { success: false, error: 'network_error', message: 'could not reach AI provider' };
    }
    return { success: false, error: 'api_error', message: err.message };
  }
}
