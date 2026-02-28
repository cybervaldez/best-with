import type { Headphone } from './types';

export function generateHeadphoneSignaturePrompt(headphone: Headphone): string {
  return `Analyze the general sound signature of this headphone:

Name: ${headphone.name}
Type: ${headphone.specs}

Please provide a JSON object describing this headphone's overall sound characteristics. The JSON must have:
1. "tags" — an array of 3-5 short descriptive words (e.g. "neutral", "wide-stage", "bass-forward", "airy")
2. "bars" — an array of exactly 6 objects, each with a "label" and "level"

The 6 required labels (in order):
- "Bass Presence"
- "Vocal Focus"
- "Treble Detail"
- "Soundstage"
- "Dynamic Range"
- "Warmth"

Each "level" must be one of: "low", "mid-low", "mid", "mid-high", "high"

This is about the headphone's general character — how it colors ALL music — not about a specific song.

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
