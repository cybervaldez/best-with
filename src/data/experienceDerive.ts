import type { StrengthBar, ExperienceNote } from './types';
import { LEVEL_TO_NUMBER } from './barMetadata';

interface BarDelta {
  label: string;
  hpLevel: number;
  songLevel: number;
  delta: number;
}

const DELTA_LABELS: Record<number, string> = {
  4: 'strongly emphasized',
  3: 'strongly emphasized',
  2: 'noticeably forward',
  1: 'slightly forward',
  0: 'matched',
  [-1]: 'slightly recessed',
  [-2]: 'noticeably recessed',
  [-3]: 'strongly recessed',
  [-4]: 'strongly recessed',
};

const IMPACT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  'Bass Presence': {
    positive: 'Low-end will feel more prominent and impactful than the mix intends',
    negative: 'Bass will feel lighter and less present than the mix intends',
    matched: 'Bass lands as the mix intends',
  },
  'Vocal Focus': {
    positive: 'Vocals and midrange instruments will feel pushed forward',
    negative: 'Vocals will sit further back in the mix',
    matched: 'Vocals land with the intended presence',
  },
  'Treble Detail': {
    positive: 'High-frequency details like cymbals and sibilance will feel more pronounced',
    negative: 'Treble will feel smoother and less detailed',
    matched: 'Treble detail matches the mix\'s intention',
  },
  'Soundstage': {
    positive: 'Spatial elements will feel wider and more spread out',
    negative: 'The stereo image will feel narrower and more intimate',
    matched: 'Spatial width matches the recording\'s intent',
  },
  'Dynamic Range': {
    positive: 'Loud/quiet contrasts will feel more dramatic',
    negative: 'Dynamic swings will feel more compressed and even',
    matched: 'Dynamics are reproduced faithfully',
  },
  'Warmth': {
    positive: 'Lower-mids will add body and richness beyond the mix',
    negative: 'The sound will feel leaner and less full-bodied',
    matched: 'Warmth and body match the recording',
  },
};

function getDeltaLabel(delta: number): string {
  return DELTA_LABELS[Math.max(-4, Math.min(4, delta))] ?? 'matched';
}

export function computeDeltas(hpBars: StrengthBar[], songBars: StrengthBar[]): BarDelta[] {
  const songMap = new Map(songBars.map((b) => [b.label, LEVEL_TO_NUMBER[b.level] ?? 3]));
  return hpBars.map((bar) => {
    const hpLevel = LEVEL_TO_NUMBER[bar.level] ?? 3;
    const songLevel = songMap.get(bar.label) ?? 3;
    return { label: bar.label, hpLevel, songLevel, delta: hpLevel - songLevel };
  });
}

export function deriveExperienceNote(hpBars: StrengthBar[], songBars: StrengthBar[]): ExperienceNote {
  const deltas = computeDeltas(hpBars, songBars);

  // Build tagline from top 2-3 most significant deltas
  const significant = [...deltas]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .filter((d) => d.delta !== 0)
    .slice(0, 3);

  let tagline: string;
  if (significant.length === 0) {
    tagline = 'Faithful reproduction — this headphone matches the song\'s signature closely';
  } else {
    const parts = significant.map((d) => {
      const shortLabel = d.label.replace(' Presence', '').replace(' Focus', '').replace(' Detail', '').replace(' Range', '');
      return `${getDeltaLabel(d.delta)} ${shortLabel.toLowerCase()}`;
    });
    tagline = parts.join(', ');
    tagline = tagline.charAt(0).toUpperCase() + tagline.slice(1);
  }

  // Build description from all deltas
  const lines = deltas.map((d) => {
    const impact = IMPACT_DESCRIPTIONS[d.label];
    if (!impact) return null;
    if (d.delta === 0) return `${d.label}: ${impact.matched}`;
    const dir = d.delta > 0 ? 'positive' : 'negative';
    const magnitude = Math.abs(d.delta) >= 2 ? 'noticeably' : 'slightly';
    return `${d.label} (${d.delta > 0 ? '+' : ''}${d.delta}): ${impact[dir]} — ${magnitude}`;
  }).filter(Boolean);

  return {
    tagline,
    description: lines.join('\n'),
    source: 'auto',
  };
}

export function formatDeltasForPrompt(hpBars: StrengthBar[], songBars: StrengthBar[]): string {
  const deltas = computeDeltas(hpBars, songBars);
  return deltas.map((d) => {
    const sign = d.delta > 0 ? '+' : d.delta === 0 ? '=' : '';
    return `- ${d.label}: HP ${d.hpLevel}/5 vs Song ${d.songLevel}/5 (${sign}${d.delta}) — ${getDeltaLabel(d.delta)}`;
  }).join('\n');
}
