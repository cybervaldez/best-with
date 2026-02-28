import { useState, useCallback } from 'react';
import { Song, Experience } from '../data/types';

interface Props {
  song: Song;
  experiences: Experience[];
}

function formatFull(song: Song, experiences: Experience[]): string {
  const lines = [`${song.title} \u2014 ${song.artist} (${song.album})`, ''];
  for (const exp of experiences) {
    lines.push(`\u{1F3A7} ${exp.headphone.name}`);
    lines.push(exp.tagline);
    lines.push(exp.description);
    lines.push(
      exp.bars.map((b) => `${b.label}: ${b.level}`).join(' | ')
    );
    lines.push('');
  }
  return lines.join('\n');
}

function formatShort(song: Song, experiences: Experience[]): string {
  const lines = [`${song.title} \u2014 ${song.artist}`, ''];
  for (const exp of experiences) {
    lines.push(`${exp.headphone.name}: ${exp.tagline}`);
  }
  return lines.join('\n');
}

export default function CopyActions({ song, experiences }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(
    async (mode: 'full' | 'short') => {
      const text =
        mode === 'full'
          ? formatFull(song, experiences)
          : formatShort(song, experiences);
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(mode);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // clipboard API may be unavailable
      }
    },
    [song, experiences]
  );

  return (
    <div className="copy-actions" data-testid="copy-actions">
      <button
        className={`btn-copy primary${copiedId === 'full' ? ' copied' : ''}`}
        data-testid="copy-full-btn"
        onClick={() => copy('full')}
      >
        {copiedId === 'full' ? '\u2713 Copied!' : '\u{1F4CB} Copy All Experiences'}
      </button>
      <button
        className={`btn-copy secondary${copiedId === 'short' ? ' copied' : ''}`}
        data-testid="copy-short-btn"
        onClick={() => copy('short')}
      >
        {copiedId === 'short' ? '\u2713 Copied!' : '\u{1F4CB} Copy Short'}
      </button>
    </div>
  );
}
