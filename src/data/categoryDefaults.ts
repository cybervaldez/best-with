import type { BuiltInCategory, CategoryRuleSet } from './types';

export const BUILT_IN_CATEGORIES: BuiltInCategory[] = [
  'dark', 'bright', 'balanced', 'unmatched', 'v-shaped', 'warm', 'analytical', 'intimate',
];

export const BAR_LABELS = [
  'Bass Presence',
  'Vocal Focus',
  'Treble Detail',
  'Soundstage',
  'Dynamic Range',
  'Warmth',
] as const;

export const LEVEL_NAMES = ['low', 'mid-low', 'mid', 'mid-high', 'high'] as const;

export const DEFAULT_CATEGORY_RULES: CategoryRuleSet = {
  'v-shaped': {
    'Bass Presence':  { min: 4, max: 5, gradient: 1 },
    'Treble Detail':  { min: 4, max: 5, gradient: 1 },
    'Vocal Focus':    { min: 1, max: 3, gradient: 1 },
  },
  analytical: {
    'Dynamic Range':  { min: 4, max: 5, gradient: 1 },
    'Treble Detail':  { min: 4, max: 5, gradient: 1 },
    'Soundstage':     { min: 4, max: 5, gradient: 1 },
  },
  dark: {
    'Bass Presence':  { min: 4, max: 5, gradient: 1 },
    'Warmth':         { min: 4, max: 5, gradient: 1 },
    'Treble Detail':  { min: 1, max: 3, gradient: 1 },
  },
  bright: {
    'Treble Detail':  { min: 4, max: 5, gradient: 1 },
    'Bass Presence':  { min: 1, max: 3, gradient: 1 },
    'Warmth':         { min: 1, max: 2, gradient: 1 },
  },
  intimate: {
    'Vocal Focus':    { min: 4, max: 5, gradient: 1 },
    'Soundstage':     { min: 1, max: 3, gradient: 1 },
    'Warmth':         { min: 3, max: 5, gradient: 1 },
  },
  warm: {
    'Warmth':         { min: 4, max: 5, gradient: 1 },
    'Bass Presence':  { min: 3, max: 5, gradient: 1 },
    'Vocal Focus':    { min: 3, max: 5, gradient: 1 },
  },
  balanced: {
    'Bass Presence':  { min: 3, max: 4, gradient: 1 },
    'Vocal Focus':    { min: 3, max: 4, gradient: 1 },
    'Treble Detail':  { min: 3, max: 4, gradient: 1 },
    'Warmth':         { min: 3, max: 4, gradient: 1 },
  },
  unmatched: {},
};
