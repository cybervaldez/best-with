import type { ExperienceNote, ExperienceNoteSource } from './types';

const STORAGE_PREFIX = 'experience_';

function storageKey(songId: string, headphoneId: string): string {
  return `${STORAGE_PREFIX}${songId}_${headphoneId}`;
}

export function parseExperienceNoteJSON(raw: string): ExperienceNote {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  const parsed = JSON.parse(cleaned);

  if (typeof parsed.tagline !== 'string' || !parsed.tagline.trim()) {
    throw new Error('tagline must be a non-empty string');
  }

  if (typeof parsed.description !== 'string' || !parsed.description.trim()) {
    throw new Error('description must be a non-empty string');
  }

  return {
    tagline: parsed.tagline.trim(),
    description: parsed.description.trim(),
    source: 'llm' as ExperienceNoteSource,
  };
}

export function saveExperienceNote(songId: string, headphoneId: string, note: ExperienceNote): void {
  localStorage.setItem(storageKey(songId, headphoneId), JSON.stringify(note));
}

export function loadExperienceNote(songId: string, headphoneId: string): ExperienceNote | null {
  const raw = localStorage.getItem(storageKey(songId, headphoneId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExperienceNote;
  } catch {
    return null;
  }
}

export function deleteExperienceNote(songId: string, headphoneId: string): void {
  localStorage.removeItem(storageKey(songId, headphoneId));
}
