import type { BarLevel, StrengthBar, HeadphoneCategory, CategoryRuleSet, CategoryRule, FilterMode, CategoryScore, DerivedCategories } from './types';
import { DEFAULT_CATEGORY_RULES } from './categoryDefaults';

const LEVEL_VALUE: Record<BarLevel, number> = {
  'low': 1,
  'mid-low': 2,
  'mid': 3,
  'mid-high': 4,
  'high': 5,
};

export const BUILT_IN_PRIORITY: HeadphoneCategory[] = [
  'v-shaped',
  'analytical',
  'dark',
  'bright',
  'intimate',
  'warm',
  'balanced',
];

function barValue(bars: StrengthBar[], label: string): number {
  const bar = bars.find((b) => b.label === label);
  return bar ? LEVEL_VALUE[bar.level] : 0;
}


// Scoring constants
export const SCORE_PADDING = 1;
export const SECONDARY_THRESHOLD = 0.65;
export const MAX_SECONDARY = 2;

/** Score a single category rule against bar values. Returns 0-1. */
export function scoreRule(
  bars: StrengthBar[],
  rule: CategoryRule,
  mode: FilterMode,
): number {
  const entries = Object.entries(rule).filter(([, c]) => c != null);
  if (entries.length === 0) return 0;

  let total = 0;
  for (const [label, constraint] of entries) {
    if (!constraint) continue;
    const val = barValue(bars, label);
    if (val === 0) return 0;

    const mid = (constraint.min + constraint.max) / 2;
    const halfPrecise = (constraint.max - constraint.min) / 2;
    const grad = mode === 'ballpark' ? constraint.gradient : 0;
    const maxDist = halfPrecise + grad;
    const dist = Math.abs(val - mid);

    if (dist > maxDist) return 0;

    const barScore = maxDist === 0
      ? (dist === 0 ? 1 : 0)
      : 1 - dist / (maxDist + SCORE_PADDING);

    total += barScore;
  }

  return total / entries.length;
}

/** Derive primary + secondary categories with scored matching. */
export function deriveCategories(
  bars: StrengthBar[],
  rules: CategoryRuleSet = DEFAULT_CATEGORY_RULES,
  mode: FilterMode = 'precise',
  customCategoryIds: string[] = [],
): DerivedCategories {
  const allIds = [...BUILT_IN_PRIORITY, ...customCategoryIds];
  const scores: CategoryScore[] = [];

  for (const id of allIds) {
    const rule = rules[id];
    if (!rule) continue;
    const score = scoreRule(bars, rule, mode);
    if (score > 0) {
      scores.push({ categoryId: id, score });
    }
  }

  // Sort descending by score (stable: preserves priority order for ties)
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return { primary: 'unmatched', secondary: [], scores: [] };
  }

  const primary = scores[0].categoryId;
  const threshold = scores[0].score * SECONDARY_THRESHOLD;
  const secondary = scores
    .slice(1)
    .filter((s) => s.score >= threshold)
    .slice(0, MAX_SECONDARY)
    .map((s) => s.categoryId);

  return { primary, secondary, scores };
}

/** Derives single primary category (backward-compatible wrapper). */
export function deriveCategory(
  bars: StrengthBar[],
  rules: CategoryRuleSet = DEFAULT_CATEGORY_RULES,
  mode: FilterMode = 'precise',
  customCategoryIds: string[] = [],
): HeadphoneCategory {
  return deriveCategories(bars, rules, mode, customCategoryIds).primary;
}
