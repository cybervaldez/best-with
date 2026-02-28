import { Song, Headphone, Experience } from './types';

export const mockSong: Song = {
  id: 'mock-pink-white',
  title: 'Pink + White',
  artist: 'Frank Ocean',
  album: 'Blonde',
  albumArtEmoji: '\u{1F3B5}',
  tags: ['dreamy', 'layered', 'vocal-rich', 'nostalgic'],
};

export const headphones: Headphone[] = [
  {
    id: 'hd600',
    name: 'Sennheiser HD 600',
    specs: 'open-back \u00B7 300\u2126 \u00B7 dynamic',
    dotColor: 'sennheiser',
  },
  {
    id: 'xm5',
    name: 'Sony WH-1000XM5',
    specs: 'closed-back \u00B7 ANC \u00B7 dynamic',
    dotColor: 'sony',
  },
  {
    id: 'airpods',
    name: 'Apple AirPods Pro 2',
    specs: 'in-ear \u00B7 ANC \u00B7 dynamic',
    dotColor: 'apple',
  },
];

export const experiences: Experience[] = [
  {
    headphone: headphones[0],
    scheme: 'sennheiser',
    tagline: '\u201CThe sit-back-and-notice-every-detail experience\u201D',
    description:
      'The layered vocals float in open air \u2014 you\u2019ll hear Frank\u2019s voice center-stage with the backing harmonies drifting wide left and right. The acoustic guitar has a woody, natural texture. The bass is present but polite \u2014 never intrusive, always musical. Every breath and string buzz is audible.',
    bars: [
      { label: 'Bass', level: 'mid-low' },
      { label: 'Mids', level: 'high' },
      { label: 'Treble', level: 'mid-high' },
      { label: 'Stage', level: 'high' },
      { label: 'Detail', level: 'high' },
      { label: 'Warmth', level: 'mid' },
    ],
  },
  {
    headphone: headphones[1],
    scheme: 'sony',
    tagline: '\u201CThe close-your-eyes-on-the-train experience\u201D',
    description:
      'The sub-bass warmth wraps around you \u2014 the beat hits fuller and rounder. Frank\u2019s voice feels closer, more intimate, like a private performance. You\u2019ll lose some of the left-right separation but gain emotional weight. The noise cancelling lets the quiet passages breathe in silence.',
    bars: [
      { label: 'Bass', level: 'high' },
      { label: 'Mids', level: 'mid' },
      { label: 'Treble', level: 'mid-low' },
      { label: 'Stage', level: 'mid-low' },
      { label: 'Detail', level: 'mid' },
      { label: 'Warmth', level: 'high' },
    ],
  },
  {
    headphone: headphones[2],
    scheme: 'apple',
    tagline: '\u201CThe everyday, anywhere experience\u201D',
    description:
      'Clean and balanced \u2014 the song sounds familiar, like how most people hear it. The spatial audio processing adds a subtle width. The bass is controlled, the vocals clear. Convenient and consistent \u2014 what you\u2019d reach for when you want the song without thinking about the gear.',
    bars: [
      { label: 'Bass', level: 'mid' },
      { label: 'Mids', level: 'mid' },
      { label: 'Treble', level: 'mid' },
      { label: 'Stage', level: 'mid-low' },
      { label: 'Detail', level: 'mid-low' },
      { label: 'Warmth', level: 'mid' },
    ],
  },
];
