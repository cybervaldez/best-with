import type { Headphone, HeadphoneSignature, HeadphoneCategory } from './types';
import { BUILT_IN_PRIORITY, deriveCategories } from './headphoneCategory';
import { PRESETS, PRESET_MAP } from './presets';

export interface SpectrumSlot {
  category: HeadphoneCategory;
  presetId: string | null;
  source: 'collection' | 'preset' | 'none';
  alternatives: string[];
}

const SPECTRUM_STORAGE_KEY = 'spectrum_selections';

export function loadSpectrumSelections(): Record<string, string> {
  const raw = localStorage.getItem(SPECTRUM_STORAGE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function saveSpectrumSelections(selections: Record<string, string>): void {
  localStorage.setItem(SPECTRUM_STORAGE_KEY, JSON.stringify(selections));
}

export function presetToHeadphone(presetId: string): Headphone | null {
  const preset = PRESET_MAP[presetId];
  if (!preset) return null;
  return { id: preset.id, name: preset.name, specs: preset.specs, dotColor: preset.dotColor };
}

export function presetToSignature(presetId: string): HeadphoneSignature | null {
  const preset = PRESET_MAP[presetId];
  if (!preset) return null;
  const derived = deriveCategories(preset.baseline.bars);
  const perspective = {
    perspectiveId: 'preset-' + presetId,
    label: preset.name,
    tags: [...preset.baseline.tags],
    bars: [...preset.baseline.bars],
    category: derived.primary,
    secondaryCategories: derived.secondary,
    source: 'preset' as const,
  };
  return {
    tags: [...preset.baseline.tags],
    bars: [...preset.baseline.bars],
    category: derived.primary,
    secondaryCategories: derived.secondary,
    perspectives: [perspective],
    defaultPerspectiveId: perspective.perspectiveId,
  };
}

/**
 * Build the spectrum: one slot per BUILT_IN_PRIORITY category.
 * Collection headphones take priority, then presets fill gaps.
 */
export function buildSpectrum(
  collectionIds: string[],
  hpSignatures: Record<string, HeadphoneSignature>,
  pinnedSelections: Record<string, string>,
): SpectrumSlot[] {
  // Step 1: Derive categories for all presets
  const categoryPresets: Record<string, string[]> = {};
  for (const preset of PRESETS) {
    const derived = deriveCategories(preset.baseline.bars);
    const cat = derived.primary;
    if (!categoryPresets[cat]) categoryPresets[cat] = [];
    categoryPresets[cat].push(preset.id);
  }

  // Step 2: Map collection headphones to categories
  const categoryCollection: Record<string, string[]> = {};
  for (const id of collectionIds) {
    const sig = hpSignatures[id];
    if (sig) {
      const cat = sig.category;
      if (!categoryCollection[cat]) categoryCollection[cat] = [];
      categoryCollection[cat].push(id);
    }
  }

  // Step 3: Assemble one slot per category
  const slots: SpectrumSlot[] = [];

  for (const category of BUILT_IN_PRIORITY) {
    const collectionMatches = categoryCollection[category] ?? [];
    const presetMatches = categoryPresets[category] ?? [];
    // All possible IDs for this category (deduped)
    const allOptions = [...new Set([...collectionMatches, ...presetMatches])];

    if (collectionMatches.length > 0) {
      const pinned = pinnedSelections[category];
      const chosen = pinned && allOptions.includes(pinned) ? pinned : collectionMatches[0];
      slots.push({
        category,
        presetId: chosen,
        source: 'collection',
        alternatives: allOptions.filter((id) => id !== chosen),
      });
    } else if (presetMatches.length > 0) {
      const pinned = pinnedSelections[category];
      const chosen = pinned && presetMatches.includes(pinned)
        ? pinned
        : presetMatches[Math.floor(Math.random() * presetMatches.length)];
      slots.push({
        category,
        presetId: chosen,
        source: 'preset',
        alternatives: presetMatches.filter((id) => id !== chosen),
      });
    } else {
      slots.push({
        category,
        presetId: null,
        source: 'none',
        alternatives: [],
      });
    }
  }

  return slots;
}
