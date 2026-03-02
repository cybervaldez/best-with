import type { Song, SongSignature, Headphone, HeadphoneSignature } from './types';
import { formatDeltasForPrompt } from './experienceDerive';

export function generateExperiencePrompt(
  song: Song,
  songSignature: SongSignature,
  headphone: Headphone,
  hpSignature: HeadphoneSignature,
  voicePromptHint?: string,
): string {
  const songBarsStr = songSignature.bars
    .map((b) => `  ${b.label}: ${b.level}`)
    .join('\n');

  const hpBarsStr = hpSignature.bars
    .map((b) => `  ${b.label}: ${b.level}`)
    .join('\n');

  const deltasStr = formatDeltasForPrompt(hpSignature.bars, songSignature.bars);

  const hasSections = songSignature.sections && songSignature.sections.length > 0;

  let sectionsStr = '';
  if (hasSections) {
    sectionsStr = `\nSONG STRUCTURE:\n${songSignature.sections!
      .map((s) => `  ${s.time} ${s.label}: ${s.description}`)
      .join('\n')}\n`;
  }

  const sectionsJsonExample = hasSections
    ? `,
  "sections": [
${songSignature.sections!.map((s) => `    { "time": "${s.time}", "label": "${s.label}", "description": "How this section sounds on this headphone" }`).join(',\n')}
  ]`
    : '';

  const sectionsInstruction = hasSections
    ? `\n3. "sections" — an array matching the song structure above. For each section, describe how it sounds on THIS headphone. Keep each description to 1 sentence focused on what the listener notices.`
    : '';

  const voiceBlock = voicePromptHint
    ? `\nVOICE / PERSONALITY:\n${voicePromptHint.replace('{headphoneName}', headphone.name)}\n`
    : '';

  return `Describe how this specific song sounds on this specific headphone. Focus on the EXPERIENCE — how the headphone's character shapes the listener's perception of this particular song. There is no "best" headphone — describe the unique coloration and experience this pairing creates.
${voiceBlock}
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

Based on the comparison above${hasSections ? ' and the song\'s structure' : ''}, describe the listening experience. Reference specific moments or elements of the song where the headphone's character would be most noticeable.

Respond with ONLY a JSON object:
1. "tagline" — a short evocative one-liner describing the experience
2. "description" — 2-3 sentences about how the song sounds on this headphone. Focus on what the listener FEELS, not frequency response.${sectionsInstruction}
${voicePromptHint ? `${hasSections ? '4' : '3'}. "videoReviewUrl" — (optional) if you found a YouTube video review of this headphone by the specified reviewer, include the URL here. Omit this field if no video was found.\n` : ''}
{
  "tagline": "A short evocative one-liner (e.g. \\"The close-your-eyes-on-the-train experience\\")",
  "description": "2-3 sentences about the overall experience."${sectionsJsonExample}${voicePromptHint ? `,
  "videoReviewUrl": "https://youtube.com/watch?v=... (optional, only if found)"` : ''}
}`;
}
