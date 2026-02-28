import type { HeadphonePreset, HeadphoneBrand, HeadphoneFormFactor, BarLevel } from './types';

function bars(sub: number, bass: number, mid: number, treble: number, width: number, dyn: number) {
  const levels: BarLevel[] = ['low', 'mid-low', 'mid', 'mid-high', 'high'];
  const toLevel = (n: number): BarLevel => levels[n - 1] ?? 'mid';
  return [
    { label: 'Bass Presence', level: toLevel(sub) },
    { label: 'Vocal Focus', level: toLevel(bass) },
    { label: 'Treble Detail', level: toLevel(mid) },
    { label: 'Soundstage', level: toLevel(treble) },
    { label: 'Dynamic Range', level: toLevel(width) },
    { label: 'Warmth', level: toLevel(dyn) },
  ];
}

export const PRESETS: HeadphonePreset[] = [
  {
    id: 'airpods-pro-3',
    name: 'AirPods Pro 3',
    brand: 'apple',
    formFactor: 'tws',
    connectivity: 'wireless',
    features: ['anc', 'transparency', 'spatial-audio'],
    specs: 'tws \u00B7 ANC \u00B7 H2 chip',
    dotColor: 'blue',
    baseline: {
      bars: bars(4, 3, 4, 3, 3, 3),
      tags: ['v-shaped', 'punchy', 'modern'],
    },
  },
  {
    id: 'airpods-pro-2',
    name: 'AirPods Pro 2',
    brand: 'apple',
    formFactor: 'tws',
    connectivity: 'wireless',
    features: ['anc', 'transparency', 'spatial-audio'],
    specs: 'tws \u00B7 ANC \u00B7 H2 chip',
    dotColor: 'blue',
    baseline: {
      bars: bars(4, 4, 4, 3, 4, 4),
      tags: ['balanced', 'clean', 'versatile'],
    },
  },
  {
    id: 'airpods-4-anc',
    name: 'AirPods 4 (ANC)',
    brand: 'apple',
    formFactor: 'tws',
    connectivity: 'wireless',
    features: ['anc', 'transparency', 'spatial-audio'],
    specs: 'tws \u00B7 ANC \u00B7 H2 chip',
    dotColor: 'blue',
    baseline: {
      bars: bars(3, 4, 4, 3, 3, 3),
      tags: ['intimate', 'vocal-forward', 'casual'],
    },
  },
  {
    id: 'airpods-4',
    name: 'AirPods 4',
    brand: 'apple',
    formFactor: 'earbud',
    connectivity: 'wireless',
    features: ['spatial-audio'],
    specs: 'earbud \u00B7 open-fit \u00B7 H2 chip',
    dotColor: 'blue',
    baseline: {
      bars: bars(3, 4, 3, 3, 3, 3),
      tags: ['balanced', 'light', 'everyday'],
    },
  },
  {
    id: 'airpods-max-usbc',
    name: 'AirPods Max (USB-C)',
    brand: 'apple',
    formFactor: 'over-ear',
    connectivity: 'wireless',
    features: ['anc', 'transparency', 'spatial-audio'],
    specs: 'over-ear \u00B7 ANC \u00B7 H1 chip',
    dotColor: 'blue',
    baseline: {
      bars: bars(4, 4, 4, 4, 4, 4),
      tags: ['warm', 'spacious', 'premium'],
    },
  },
  {
    id: 'earpods-usbc',
    name: 'EarPods (USB-C)',
    brand: 'apple',
    formFactor: 'earbud',
    connectivity: 'wired',
    features: [],
    specs: 'earbud \u00B7 wired \u00B7 USB-C',
    dotColor: 'blue',
    baseline: {
      bars: bars(2, 4, 3, 2, 2, 3),
      tags: ['intimate', 'mid-forward', 'basic'],
    },
  },
];

export const PRESET_MAP: Record<string, HeadphonePreset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
);

export function getPresetsByBrand(brand: HeadphoneBrand): HeadphonePreset[] {
  return PRESETS.filter((p) => p.brand === brand);
}

export function getPresetsByFormFactor(ff: HeadphoneFormFactor): HeadphonePreset[] {
  return PRESETS.filter((p) => p.formFactor === ff);
}
