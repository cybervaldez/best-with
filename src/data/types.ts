export type BarLevel = 'low' | 'mid-low' | 'mid' | 'mid-high' | 'high';
export type ColorScheme = 'sennheiser' | 'sony' | 'apple';
export type DotColor = 'sennheiser' | 'sony' | 'apple';
export type ThemeId = 'default' | 'igor' | 'in-rainbows' | 'yellow-submarine' | 'kid-a';

export interface StrengthBar {
  label: string;
  level: BarLevel;
}

export interface Headphone {
  id: string;
  name: string;
  specs: string;
  dotColor: DotColor;
}

export interface Experience {
  headphone: Headphone;
  scheme: ColorScheme;
  tagline: string;
  description: string;
  bars: StrengthBar[];
}

export interface Song {
  id?: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl?: string;
  albumArtEmoji: string;
  tags: string[];
}

export interface SongSignature {
  tags: string[];
  bars: StrengthBar[];
}

export type BuiltInCategory =
  | 'dark'
  | 'bright'
  | 'balanced'
  | 'unmatched'
  | 'v-shaped'
  | 'warm'
  | 'analytical'
  | 'intimate';

export type HeadphoneCategory = BuiltInCategory | (string & {});

export interface CustomCategoryDef {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface HeadphoneSignature {
  tags: string[];
  bars: StrengthBar[];
  category: HeadphoneCategory;
  secondaryCategories?: HeadphoneCategory[];
}

export interface CategoryScore {
  categoryId: string;
  score: number;
}

export interface DerivedCategories {
  primary: HeadphoneCategory;
  secondary: HeadphoneCategory[];
  scores: CategoryScore[];
}

export interface BarConstraint {
  min: number;       // 1-5, precise minimum (inclusive)
  max: number;       // 1-5, precise maximum (inclusive)
  gradient: number;  // 0-2, extends range by N levels in ballpark mode
}

export type CategoryRule = Partial<Record<string, BarConstraint>>;
export type CategoryRuleSet = Record<string, CategoryRule>;
export type FilterMode = 'precise' | 'ballpark';
