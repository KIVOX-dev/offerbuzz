import { env } from '../config/env';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS = 12_000;
const DEFAULT_COOLDOWN_MS = 60_000;
const GONE_COOLDOWN_MS = 60 * 60_000;

/** model -> time (ms) before which it is skipped, after a rate limit or an outage. Per instance, in memory. */
const coolUntil = new Map<string, number>();

export const modelList = (): string[] =>
  env()
    .GROQ_MODELS.split(',')
    .map((m) => m.trim())
    .filter(Boolean);

export const resetGroqCooldowns = () => coolUntil.clear();

export class LlmUnavailableError extends Error {}

/**
 * Asks Groq for a JSON answer, walking down the model list: a model that is rate limited (429), overloaded (5xx),
 * retired (400/404) or too slow is skipped and put on a cooldown, and the next one is tried. Throws
 * LlmUnavailableError only when every model has failed, so the caller can fall back to a plain answer.
 */
export async function chatJson(messages: LlmMessage[]): Promise<{ text: string; model: string }> {
  const key = env().GROQ_API_KEY;
  if (!key) throw new LlmUnavailableError('GROQ_API_KEY is not set');

  for (const model of modelList()) {
    if ((coolUntil.get(model) ?? 0) > Date.now()) continue;
    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 600, response_format: { type: 'json_object' } }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const wait = res.status === 429 && retryAfter > 0 ? Math.min(retryAfter, 300) * 1000 : res.status === 429 || res.status >= 500 ? DEFAULT_COOLDOWN_MS : GONE_COOLDOWN_MS;
        coolUntil.set(model, Date.now() + wait);
        if (env().NODE_ENV !== 'test') console.warn(`Groq ${model} -> ${res.status}, trying the next model`);
        continue;
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content;
      if (text) return { text, model };
    } catch (err) {
      coolUntil.set(model, Date.now() + 30_000); // timeout or network error: rest it briefly
      if (env().NODE_ENV !== 'test') console.warn(`Groq ${model} failed: ${(err as Error).message}`);
    }
  }
  throw new LlmUnavailableError('No Groq model could answer');
}
