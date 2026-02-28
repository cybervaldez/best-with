export type BarLevel = 'low' | 'mid-low' | 'mid' | 'mid-high' | 'high';
export type ColorScheme = 'sennheiser' | 'sony' | 'apple';
export type DotColor = 'sennheiser' | 'sony' | 'apple' | 'blue';
export type ThemeId = 'default' | 'igor' | 'in-rainbows' | 'yellow-submarine' | 'kid-a';

export type HeadphoneFormFactor = 'over-ear' | 'on-ear' | 'iem' | 'tws' | 'earbud';
export type HeadphoneConnectivity = 'wired' | 'wireless' | 'hybrid';
export type HeadphoneFeature = 'anc' | 'transparency' | 'spatial-audio' | 'lossless' | 'ldac' | 'aptx';
export type HeadphoneBrand = 'apple' | 'sony' | 'sennheiser' | 'beyerdynamic' | 'hifiman' | 'audeze';

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

export interface PresetVariation {
  source: string;
  bars: StrengthBar[];
  tags?: string[];
}

export interface HeadphonePreset {
  id: string;
  name: string;
  brand: HeadphoneBrand;
  formFactor: HeadphoneFormFactor;
  connectivity: HeadphoneConnectivity;
  features: HeadphoneFeature[];
  specs: string;
  dotColor: DotColor;
  baseline: {
    bars: StrengthBar[];
    tags: string[];
  };
  variations?: PresetVariation[];
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

export interface SongSection {
  time: string;        // e.g. "0:00–0:32"
  label: string;       // e.g. "Intro"
  description: string; // e.g. "Sparse piano, reverbed vocal hum"
}

export interface SongSignature {
  tags: string[];
  bars: StrengthBar[];
  sections?: SongSection[];
}

export type ExperienceNoteSource = 'auto' | 'llm' | 'manual';

export interface ExperienceNote {
  tagline: string;
  description: string;
  source: ExperienceNoteSource;
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
