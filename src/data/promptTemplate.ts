import type { Song } from './types';

export function generateSignaturePrompt(song: Song): string {
  return `Analyze the sound signature of this song:

Title: ${song.title}
Artist: ${song.artist}
Album: ${song.album}

Please provide a JSON object describing this song's audio characteristics. The JSON must have:
1. "tags" — an array of 3-5 short descriptive words (e.g. "dreamy", "bass-heavy", "crisp")
2. "bars" — an array of exactly 6 objects, each with a "label" and "level"

The 6 required labels (in order):
- "Bass Presence"
- "Vocal Focus"
- "Treble Detail"
- "Soundstage"
- "Dynamic Range"
- "Warmth"

Each "level" must be one of: "low", "mid-low", "mid", "mid-high", "high"

Respond with ONLY the JSON object, no other text:

{
  "tags": ["...", "...", "..."],
  "bars": [
    { "label": "Bass Presence", "level": "..." },
    { "label": "Vocal Focus", "level": "..." },
    { "label": "Treble Detail", "level": "..." },
    { "label": "Soundstage", "level": "..." },
    { "label": "Dynamic Range", "level": "..." },
    { "label": "Warmth", "level": "..." }
  ]
}`;
}
