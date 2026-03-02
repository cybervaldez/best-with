import type { HeadphoneSignature, BarLevel, CategoryRuleSet, FilterMode, SignaturePerspective } from './types';
import { deriveCategories } from './headphoneCategory';

const STORAGE_PREFIX = 'headphone_signature_';

const VALID_LEVELS: BarLevel[] = ['low', 'mid-low', 'mid', 'mid-high', 'high'];

const REQUIRED_LABELS = [
  'Bass Presence',
  'Vocal Focus',
  'Treble Detail',
  'Soundstage',
  'Dynamic Range',
  'Warmth',
];

export function parseHeadphoneSignatureJSON(
  raw: string,
  rules?: CategoryRuleSet,
  mode?: FilterMode,
): HeadphoneSignature {
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

  const tags = parsed.tags as string[];
  const bars = parsed.bars.map((b: { label: string; level: BarLevel }) => ({
    label: b.label,
    level: b.level,
  }));

  const derived = deriveCategories(bars, rules, mode);

  const perspective: SignaturePerspective = {
    perspectiveId: 'llm-' + Date.now(),
    label: 'LLM',
    tags,
    bars,
    category: derived.primary,
    secondaryCategories: derived.secondary,
    source: 'llm',
  };

  return {
    tags,
    bars,
    category: derived.primary,
    secondaryCategories: derived.secondary,
    perspectives: [perspective],
    defaultPerspectiveId: perspective.perspectiveId,
  };
}

export function saveHeadphoneSignature(headphoneId: string, signature: HeadphoneSignature): void {
  localStorage.setItem(STORAGE_PREFIX + headphoneId, JSON.stringify(signature));
}

export function loadHeadphoneSignature(headphoneId: string): HeadphoneSignature | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + headphoneId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HeadphoneSignature;
  } catch {
    return null;
  }
}

export function deleteHeadphoneSignature(headphoneId: string): void {
  localStorage.removeItem(STORAGE_PREFIX + headphoneId);
}
