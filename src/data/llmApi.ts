import type { LlmTag } from './types';

export interface LlmApiError {
  type: 'auth' | 'rate-limit' | 'network' | 'parse' | 'unknown';
  message: string;
  status?: number;
}

export type LlmResult = {
  ok: true;
  text: string;
} | {
  ok: false;
  error: LlmApiError;
};

function errorResult(type: LlmApiError['type'], message: string, status?: number): LlmResult {
  return { ok: false, error: { type, message, status } };
}

// ── OpenAI (ChatGPT) ────────────────────────────────────────────────
async function callOpenAI(apiKey: string, prompt: string): Promise<LlmResult> {
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
  } catch {
    return errorResult('network', 'Network error — check your connection');
  }

  if (res.status === 401) return errorResult('auth', 'Invalid OpenAI API key', 401);
  if (res.status === 429) return errorResult('rate-limit', 'OpenAI rate limit reached — try again shortly', 429);
  if (!res.ok) return errorResult('unknown', `OpenAI error (${res.status})`, res.status);

  try {
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string') return errorResult('parse', 'Unexpected OpenAI response format');
    return { ok: true, text };
  } catch {
    return errorResult('parse', 'Failed to parse OpenAI response');
  }
}

// ── Anthropic (Claude) ──────────────────────────────────────────────
async function callAnthropic(apiKey: string, prompt: string): Promise<LlmResult> {
  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch {
    return errorResult('network', 'Network error — check your connection');
  }

  if (res.status === 401) return errorResult('auth', 'Invalid Anthropic API key', 401);
  if (res.status === 429) return errorResult('rate-limit', 'Anthropic rate limit reached — try again shortly', 429);
  if (!res.ok) return errorResult('unknown', `Anthropic error (${res.status})`, res.status);

  try {
    const json = await res.json();
    const block = json.content?.[0];
    if (block?.type !== 'text' || typeof block.text !== 'string') {
      return errorResult('parse', 'Unexpected Anthropic response format');
    }
    return { ok: true, text: block.text };
  } catch {
    return errorResult('parse', 'Failed to parse Anthropic response');
  }
}

// ── Google (Gemini) ─────────────────────────────────────────────────
async function callGemini(apiKey: string, prompt: string): Promise<LlmResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    });
  } catch {
    return errorResult('network', 'Network error — check your connection');
  }

  if (res.status === 401 || res.status === 403) return errorResult('auth', 'Invalid Google API key', res.status);
  if (res.status === 429) return errorResult('rate-limit', 'Google rate limit reached — try again shortly', 429);
  if (!res.ok) return errorResult('unknown', `Google error (${res.status})`, res.status);

  try {
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return errorResult('parse', 'Unexpected Google response format');
    return { ok: true, text };
  } catch {
    return errorResult('parse', 'Failed to parse Google response');
  }
}

// ── Public API ──────────────────────────────────────────────────────

const PROVIDER_FNS: Record<string, (apiKey: string, prompt: string) => Promise<LlmResult>> = {
  chatgpt: callOpenAI,
  claude: callAnthropic,
  gemini: callGemini,
};

/**
 * Generate text using the specified LLM provider.
 * Returns raw text on success or a typed error on failure.
 * The 'other' provider is not supported (no standard API).
 */
export async function generateWithApiKey(
  provider: LlmTag,
  apiKey: string,
  prompt: string,
): Promise<LlmResult> {
  const fn = PROVIDER_FNS[provider];
  if (!fn) return errorResult('unknown', `No API support for "${provider}" — use copy-paste instead`);
  return fn(apiKey, prompt);
}

/** Strip markdown code fences and extra whitespace from LLM response text */
export function extractJSON(raw: string): string {
  let text = raw.trim();
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) text = fenceMatch[1].trim();
  return text;
}
