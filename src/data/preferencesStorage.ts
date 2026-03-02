const STORAGE_KEY = 'api_key_preferences';

export function loadApiKeys(): Record<string, string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveApiKeys(keys: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getApiKey(provider: string): string | undefined {
  const keys = loadApiKeys();
  return keys[provider] || undefined;
}
