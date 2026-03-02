import type { SongSignature, SongSection, BarLevel, SignaturePerspective } from './types';

const STORAGE_PREFIX = 'song_signature_';

const VALID_LEVELS: BarLevel[] = ['low', 'mid-low', 'mid', 'mid-high', 'high'];

const REQUIRED_LABELS = [
  'Bass Presence',
  'Vocal Focus',
  'Treble Detail',
  'Soundstage',
  'Dynamic Range',
  'Warmth',
];

export function parseSongSignatureJSON(raw: string): SongSignature {
  // Strip markdown code fences
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed.tags) || !parsed.tags.every((t: unknown) => typeof t === 'string')) {
    throw new Error('tags must be an array of strings');
  }

  if (!Array.isArray(parsed.bars) || parsed.bars.length !== 6) {
    throw new Error('bars must be an array of exactly 6 items');
  }

  for (const bar of parsed.bars) {
    if (!REQUIRED_LABELS.includes(bar.label)) {
      throw new Error(`Invalid bar label: "${bar.label}". Expected one of: ${REQUIRED_LABELS.join(', ')}`);
    }
    if (!VALID_LEVELS.includes(bar.level)) {
      throw new Error(`Invalid level "${bar.level}" for "${bar.label}". Expected one of: ${VALID_LEVELS.join(', ')}`);
    }
  }

  const labelSet = new Set(parsed.bars.map((b: { label: string }) => b.label));
  if (labelSet.size !== 6) {
    throw new Error('All 6 bar labels must be unique');
  }

  let sections: SongSection[] | undefined;
  if (Array.isArray(parsed.sections)) {
    const parsed_sections = parsed.sections
      .filter((s: any) => typeof s.time === 'string' && typeof s.label === 'string' && typeof s.description === 'string')
      .map((s: any) => ({ time: s.time, label: s.label, description: s.description }));
    if (parsed_sections.length > 0) sections = parsed_sections;
  }

  const tags = parsed.tags as string[];
  const bars = parsed.bars.map((b: { label: string; level: BarLevel }) => ({
    label: b.label,
    level: b.level,
  }));

  const perspective: SignaturePerspective = {
    perspectiveId: 'llm-' + Date.now(),
    label: 'LLM',
    tags,
    bars,
    ...(sections ? { sections } : {}),
    source: 'llm',
  };

  return {
    tags,
    bars,
    ...(sections ? { sections } : {}),
    perspectives: [perspective],
    defaultPerspectiveId: perspective.perspectiveId,
  };
}

export function saveSongSignature(songId: string, signature: SongSignature): void {
  localStorage.setItem(STORAGE_PREFIX + songId, JSON.stringify(signature));
}

export function loadSongSignature(songId: string): SongSignature | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + songId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SongSignature;
  } catch {
    return null;
  }
}

export function deleteSongSignature(songId: string): void {
  localStorage.removeItem(STORAGE_PREFIX + songId);
}
