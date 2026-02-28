import type { Song } from './types';

export function generateSignaturePrompt(song: Song): string {
  return `Analyze the sound signature of this song:

Title: ${song.title}
Artist: ${song.artist}
Album: ${song.album}

Please provide a JSON object describing this song's audio characteristics. The JSON must have:
1. "tags" — an array of 3-5 short descriptive words (e.g. "dreamy", "bass-heavy", "crisp")
2. "bars" — an array of exactly 6 objects, each with a "label" and "level"
3. "sections" — an array describing the song's structure over time. Each section has:
   - "time": timestamp range (e.g. "0:00–0:32")
   - "label": section name (e.g. "Intro", "Verse 1", "Chorus")
   - "description": brief description of what's happening sonically (instruments, energy, texture)

The 6 required bar labels (in order):
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
  ],
  "sections": [
    { "time": "0:00–0:30", "label": "Intro", "description": "..." },
    { "time": "0:30–1:10", "label": "Verse 1", "description": "..." }
  ]
}`;
}
