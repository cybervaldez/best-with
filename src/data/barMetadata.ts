import type { BarLevel } from './types';

export const TICK_LABELS = ['L', 'ML', 'M', 'MH', 'H'];
export const TICK_POSITIONS = [10, 30, 50, 70, 90];

export const LEVEL_TO_NUMBER: Record<BarLevel, number> = {
  low: 1, 'mid-low': 2, mid: 3, 'mid-high': 4, high: 5,
};
export const NUMBER_TO_LEVEL: BarLevel[] = ['low', 'mid-low', 'mid', 'mid-high', 'high'];

export const BAR_FREQ_SUBTITLES: Record<string, string> = {
  'Bass Presence': '20–250 Hz',
  'Vocal Focus': '250 Hz–4 kHz',
  'Treble Detail': '4–20 kHz',
  'Soundstage': 'Narrow → Wide',
  'Dynamic Range': 'Compressed → Expansive',
  'Warmth': '200–500 Hz',
};

export const BAR_DESCRIPTIONS: Record<string, string> = {
  'Bass Presence': 'Sub-bass through mid-bass impact. How much low-end weight and punch the headphone delivers (20–250 Hz).',
  'Vocal Focus': 'Midrange forwardness. How prominent and present vocals and lead instruments sound (250 Hz–4 kHz).',
  'Treble Detail': 'High-frequency clarity and air. Cymbal shimmer, sibilance, and overall brightness (4–20 kHz).',
  'Soundstage': 'Perceived spatial width and depth. How far outside your head the sound appears to extend.',
  'Dynamic Range': 'Micro and macro dynamics. The ability to resolve both subtle detail and large volume swings.',
  'Warmth': 'Lower-mid richness and body. Fullness in male vocals, guitar body, and string resonance (200–500 Hz).',
};

export const BAR_TICK_TOOLTIPS: Record<string, string[]> = {
  'Bass Presence': ['~20–60 Hz', '~60–120 Hz', '~80–160 Hz', '~120–200 Hz', '~160–250 Hz'],
  'Vocal Focus':   ['~250–500 Hz', '~500 Hz–1 kHz', '~800 Hz–2 kHz', '~1.5–3 kHz', '~2–4 kHz'],
  'Treble Detail': ['~4–6 kHz', '~6–9 kHz', '~8–12 kHz', '~10–16 kHz', '~14–20 kHz'],
  'Soundstage':    ['Intimate', 'Narrow', 'Average', 'Wide', 'Expansive'],
  'Dynamic Range': ['Compressed', 'Limited', 'Moderate', 'Dynamic', 'Expansive'],
  'Warmth':        ['~200–280 Hz', '~250–350 Hz', '~300–400 Hz', '~350–450 Hz', '~400–500 Hz'],
};

export const BAR_TICK_BOUNDS: Record<string, [string, string][]> = {
  'Bass Presence': [['20', '60 Hz'], ['60', '120 Hz'], ['80', '160 Hz'], ['120', '200 Hz'], ['160', '250 Hz']],
  'Vocal Focus':   [['250', '500 Hz'], ['500 Hz', '1 kHz'], ['800 Hz', '2 kHz'], ['1.5', '3 kHz'], ['2', '4 kHz']],
  'Treble Detail': [['4', '6 kHz'], ['6', '9 kHz'], ['8', '12 kHz'], ['10', '16 kHz'], ['14', '20 kHz']],
  'Soundstage':    [['Intimate', 'Intimate'], ['Narrow', 'Narrow'], ['Average', 'Average'], ['Wide', 'Wide'], ['Expansive', 'Expansive']],
  'Dynamic Range': [['Compressed', 'Compressed'], ['Limited', 'Limited'], ['Moderate', 'Moderate'], ['Dynamic', 'Dynamic'], ['Expansive', 'Expansive']],
  'Warmth':        [['200', '280 Hz'], ['250', '350 Hz'], ['300', '400 Hz'], ['350', '450 Hz'], ['400', '500 Hz']],
};

export function getReadout(barLabel: string, min: number, max: number): string | null {
  const bounds = BAR_TICK_BOUNDS[barLabel];
  if (!bounds) return null;
  const lowEntry = bounds[min - 1];
  const highEntry = bounds[max - 1];
  if (!lowEntry || !highEntry) return null;
  if (barLabel === 'Soundstage' || barLabel === 'Dynamic Range') {
    return min === max ? lowEntry[0] : `${lowEntry[0]}–${highEntry[1]}`;
  }
  return `${lowEntry[0]}–${highEntry[1]}`;
}

export function getSingleReadout(barLabel: string, level: number): string | null {
  const tooltips = BAR_TICK_TOOLTIPS[barLabel];
  if (!tooltips) return null;
  return tooltips[level - 1] ?? null;
}

export function levelToPosition(level: number): number {
  return TICK_POSITIONS[level - 1] ?? 50;
}

export function positionToLevel(pct: number): number {
  let closest = 1;
  let minDist = Infinity;
  for (let i = 0; i < TICK_POSITIONS.length; i++) {
    const dist = Math.abs(pct - TICK_POSITIONS[i]);
    if (dist < minDist) { minDist = dist; closest = i + 1; }
  }
  return closest;
}
