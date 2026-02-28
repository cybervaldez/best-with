import type { StrengthBar, ExperienceNote } from './types';
import { LEVEL_TO_NUMBER } from './barMetadata';

interface BarDelta {
  label: string;
  hpLevel: number;
  songLevel: number;
  delta: number;
}

// Song-relational descriptions: how the song will FEEL on this headphone
const EXPERIENCE_PHRASES: Record<string, { pos2: string; pos1: string; zero: string; neg1: string; neg2: string }> = {
  'Bass Presence': {
    pos2: 'The low-end hits harder than the mix calls for — expect a thicker, more physical bass',
    pos1: 'Bass feels slightly fuller, adding weight to the low-end',
    zero: 'Bass reproduced faithfully to the mix',
    neg1: 'Bass sits a touch lighter than intended — the low-end feels leaner',
    neg2: 'The low-end is noticeably pulled back — bass-heavy moments lose their punch',
  },
  'Vocal Focus': {
    pos2: 'Vocals push forward and dominate — expect an intimate, in-your-face midrange',
    pos1: 'Vocals come through slightly more present and upfront',
    zero: 'Vocals land exactly where the mix places them',
    neg1: 'Vocals sit a step back in the mix — they\'re there but not leading',
    neg2: 'Vocals recede behind instruments — the midrange takes a back seat',
  },
  'Treble Detail': {
    pos2: 'Cymbals, hi-hats, and sibilance are sharp and forward — bright and revealing',
    pos1: 'Treble has a slight sparkle, revealing more high-frequency detail',
    zero: 'Treble detail matches what the recording intended',
    neg1: 'High-end is slightly smoothed over — a more relaxed, less fatiguing listen',
    neg2: 'Treble is noticeably rolled off — high-frequency textures get lost',
  },
  'Soundstage': {
    pos2: 'The sound opens up wider than the recording — instruments spread out with extra space',
    pos1: 'Slight extra width gives the mix a bit more room to breathe',
    zero: 'Spatial presentation matches the recording\'s intent',
    neg1: 'The image feels a touch narrower — elements sit closer together',
    neg2: 'Everything feels compressed inward — wide-panned elements lose their separation',
  },
  'Dynamic Range': {
    pos2: 'Quiet-to-loud contrasts feel exaggerated — dynamic moments hit harder',
    pos1: 'Dynamics are slightly more pronounced, adding drama to swells',
    zero: 'Dynamic contrasts come through naturally',
    neg1: 'Dynamic swings feel slightly evened out — a more consistent volume',
    neg2: 'Loud and quiet passages blend together — the drama is flattened',
  },
  'Warmth': {
    pos2: 'A rich, full-bodied coloration wraps the sound in extra warmth',
    pos1: 'A touch of added warmth gives the lower-mids more body',
    zero: 'Warmth and body match the recording faithfully',
    neg1: 'The sound leans slightly cooler and thinner',
    neg2: 'The lower-mids feel stripped back — the sound comes across lean and clinical',
  },
};

function getExperiencePhrase(label: string, delta: number): string | null {
  const phrases = EXPERIENCE_PHRASES[label];
  if (!phrases) return null;
  if (delta >= 2) return phrases.pos2;
  if (delta === 1) return phrases.pos1;
  if (delta === 0) return phrases.zero;
  if (delta === -1) return phrases.neg1;
  return phrases.neg2;
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

  // Tagline: summarize the overall character of this pairing
  const significant = [...deltas]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .filter((d) => d.delta !== 0);

  let tagline: string;
  if (significant.length === 0) {
    tagline = 'This headphone reproduces the song faithfully — what you hear is what was intended';
  } else {
    // Build a narrative tagline from the top traits
    const top = significant.slice(0, 2);
    const traits: string[] = [];
    for (const d of top) {
      const short = d.label.replace(' Presence', '').replace(' Focus', '').replace(' Detail', '').replace(' Range', '').toLowerCase();
      if (d.delta >= 2) traits.push(`emphasized ${short}`);
      else if (d.delta === 1) traits.push(`slightly fuller ${short}`);
      else if (d.delta === -1) traits.push(`leaner ${short}`);
      else traits.push(`recessed ${short}`);
    }
    tagline = `Expect ${traits.join(' and ')} compared to the original mix`;
  }

  // Description: only show non-zero deltas as experiential phrases
  const lines = deltas
    .filter((d) => d.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .map((d) => getExperiencePhrase(d.label, d.delta))
    .filter(Boolean);

  let description: string;
  if (lines.length === 0) {
    description = 'This is a close match — the headphone\'s signature aligns with what this song asks for. You\'ll hear it largely as the artist intended.';
  } else {
    description = lines.join('. ') + '.';
  }

  return {
    tagline,
    description,
    source: 'auto',
  };
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

function getDeltaLabel(delta: number): string {
  return DELTA_LABELS[Math.max(-4, Math.min(4, delta))] ?? 'matched';
}

export function formatDeltasForPrompt(hpBars: StrengthBar[], songBars: StrengthBar[]): string {
  const deltas = computeDeltas(hpBars, songBars);
  return deltas.map((d) => {
    const sign = d.delta > 0 ? '+' : d.delta === 0 ? '=' : '';
    return `- ${d.label}: HP ${d.hpLevel}/5 vs Song ${d.songLevel}/5 (${sign}${d.delta}) — ${getDeltaLabel(d.delta)}`;
  }).join('\n');
}
