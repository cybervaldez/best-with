import type { CategoryRuleSet, FilterMode, CustomCategoryDef } from './types';
import { DEFAULT_CATEGORY_RULES } from './categoryDefaults';

const RULES_KEY = 'category_rules';
const MODE_KEY = 'category_filter_mode';
const CUSTOM_CATS_KEY = 'custom_categories';

export function loadCategoryRules(): CategoryRuleSet {
  const raw = localStorage.getItem(RULES_KEY);
  if (!raw) return structuredClone(DEFAULT_CATEGORY_RULES);
  try {
    return JSON.parse(raw) as CategoryRuleSet;
  } catch {
    return structuredClone(DEFAULT_CATEGORY_RULES);
  }
}

export function saveCategoryRules(rules: CategoryRuleSet): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function loadFilterMode(): FilterMode {
  const raw = localStorage.getItem(MODE_KEY);
  if (raw === 'precise' || raw === 'ballpark') return raw;
  return 'precise';
}

export function saveFilterMode(mode: FilterMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function loadCustomCategories(): CustomCategoryDef[] {
  const raw = localStorage.getItem(CUSTOM_CATS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CustomCategoryDef[];
  } catch {
    return [];
  }
}

export function saveCustomCategories(cats: CustomCategoryDef[]): void {
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(cats));
}
