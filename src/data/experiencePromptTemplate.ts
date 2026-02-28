import type { Song, SongSignature, Headphone, HeadphoneSignature } from './types';
import { formatDeltasForPrompt } from './experienceDerive';

export function generateExperiencePrompt(
  song: Song,
  songSignature: SongSignature,
  headphone: Headphone,
  hpSignature: HeadphoneSignature,
): string {
  const songBarsStr = songSignature.bars
    .map((b) => `  ${b.label}: ${b.level}`)
    .join('\n');

  const hpBarsStr = hpSignature.bars
    .map((b) => `  ${b.label}: ${b.level}`)
    .join('\n');

  const deltasStr = formatDeltasForPrompt(hpSignature.bars, songSignature.bars);

  let sectionsStr = '';
  if (songSignature.sections && songSignature.sections.length > 0) {
    sectionsStr = `\nSONG STRUCTURE:\n${songSignature.sections
      .map((s) => `  ${s.time} ${s.label}: ${s.description}`)
      .join('\n')}\n`;
  }

  return `Describe how this specific song sounds on this specific headphone. Focus on the EXPERIENCE — how the headphone's character shapes the listener's perception of this particular song. There is no "best" headphone — describe the unique coloration and experience this pairing creates.

SONG:
  Title: ${song.title}
  Artist: ${song.artist}
  Album: ${song.album}
  Tags: ${songSignature.tags.join(', ')}
  Sound signature:
${songBarsStr}
${sectionsStr}
HEADPHONE:
  Name: ${headphone.name}
  Type: ${headphone.specs}
  Tags: ${hpSignature.tags.join(', ')}
  Category: ${hpSignature.category}
  Sound signature:
${hpBarsStr}

SIGNATURE COMPARISON (headphone vs song):
${deltasStr}

Based on the comparison above${songSignature.sections ? ' and the song\'s structure' : ''}, describe the listening experience. Reference specific moments or elements of the song where the headphone's character would be most noticeable.

Respond with ONLY a JSON object:

{
  "tagline": "A short evocative one-liner in quotes describing the experience (e.g. \\"The close-your-eyes-on-the-train experience\\")",
  "description": "2-3 sentences about how the song sounds on this headphone. Reference specific song sections or sonic elements. Focus on what the listener FEELS, not just frequency response."
}`;
}
