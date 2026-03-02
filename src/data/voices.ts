import type { LlmTag } from './types';

export interface Voice {
  id: string;
  name: string;
  handle: string;
  style: string;       // short description for the UI
  promptHint: string;  // injected into the LLM prompt
}

export interface LlmTagOption {
  id: LlmTag;
  name: string;
  icon: string;
}

export const LLM_TAG_OPTIONS: LlmTagOption[] = [
  { id: 'chatgpt', name: 'ChatGPT', icon: 'GPT' },
  { id: 'gemini',  name: 'Gemini',  icon: 'GEM' },
  { id: 'claude',  name: 'Claude',  icon: 'CLD' },
  { id: 'other',   name: 'Other',   icon: 'LLM' },
];

export interface CustomVoice {
  name: string;
  handle: string;
}

export const VOICES: Voice[] = [
  {
    id: 'neutral',
    name: 'Neutral',
    handle: '',
    style: 'No personality — straightforward description',
    promptHint: '',
  },
  {
    id: 'zeos',
    name: 'Z Reviews / Zeos Pantera',
    handle: '@ZeosReviews',
    style: 'Chaotic, hyperbolic, stream-of-consciousness energy',
    promptHint: `Write in the style of Zeos Pantera (Z Reviews on YouTube). He is chaotic, hyperbolic, uses stream-of-consciousness rants, all-caps energy, colorful metaphors, and gets physically excited about bass and soundstage. He often says things like "DUDE" and uses absurd comparisons. IMPORTANT: If you have the tool for websearch, first search for whether Zeos has actually reviewed the "{headphoneName}" to capture his specific opinions and biases toward this headphone. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'dms',
    name: 'DMS',
    handle: '@DMS3TV',
    style: 'Analytical, structured, technical but accessible',
    promptHint: `Write in the style of DMS (YouTube headphone reviewer). He is analytical, structured, and methodical. He breaks down the sound scientifically but keeps it accessible. He references specific frequency ranges and uses precise audiophile terminology without being pretentious. IMPORTANT: If you have the tool for websearch, first search for whether DMS has actually reviewed the "{headphoneName}" to capture his specific opinions and biases toward this headphone. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'crinacle',
    name: 'Crinacle',
    handle: '@Crinacle',
    style: 'Data-driven, deadpan, measurement-focused, occasionally savage',
    promptHint: `Write in the style of Crinacle (In-Ear Fidelity). He is data-driven, deadpan, measurement-focused, and occasionally savage in his assessments. He references graphs and target curves implicitly, ranks things on a letter-grade scale mentally, and doesn't sugarcoat. He's skeptical of hype. IMPORTANT: If you have the tool for websearch, first search for whether Crinacle has actually reviewed the "{headphoneName}" to capture his specific measurement data and ranking. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'dankpods',
    name: 'DankPods',
    handle: '@DankPods',
    style: 'Comedy-first, irreverent, Australian slang, brutally honest',
    promptHint: `Write in the style of DankPods (Wade Nixon on YouTube). He is comedy-first, uses Australian slang, irreverent, and brutally honest about bad gear. He names things with absurd nicknames, uses phrases like "nuggets" for earbuds, and has a genuine love for good audio underneath the humor. IMPORTANT: If you have the tool for websearch, first search for whether DankPods has actually reviewed the "{headphoneName}" to capture his specific takes. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'joshua-valour',
    name: 'Joshua Valour',
    handle: '@JoshuaValour',
    style: 'Cinematic, emotive, poetic descriptions',
    promptHint: `Write in the style of Joshua Valour (YouTube audiophile reviewer). He is cinematic and emotive, using poetic and evocative language to describe sound. He focuses on the emotional journey of listening and paints vivid pictures with words. His descriptions feel like short film narrations. IMPORTANT: If you have the tool for websearch, first search for whether Joshua Valour has actually reviewed the "{headphoneName}" to capture his specific impressions. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'resolve',
    name: 'Resolve / The Headphone Show',
    handle: '@TheHeadphoneShow',
    style: 'Methodical, measurement-backed, structured listening notes',
    promptHint: `Write in the style of Resolve from The Headphone Show. He is methodical, measurement-backed, and writes structured listening notes. He references specific measurement artifacts and their audible effects, compares to well-known reference headphones, and is balanced but opinionated when warranted. IMPORTANT: If you have the tool for websearch, first search for whether Resolve/The Headphone Show has actually reviewed the "{headphoneName}" to capture his specific analysis. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'badguy',
    name: 'BadGuy Good Audio',
    handle: '@BadGuyGoodAudio',
    style: 'Casual, conversational, community-focused, relatable',
    promptHint: `Write in the style of BadGuy Good Audio Reviews (YouTube). He is casual, conversational, community-focused, and relatable. He speaks like a friend recommending gear over coffee, uses everyday language instead of audiophile jargon, and cares about value and real-world usability. IMPORTANT: If you have the tool for websearch, first search for whether BadGuy Good Audio has actually reviewed the "{headphoneName}" to capture his specific opinions. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
  {
    id: 'super-review',
    name: 'Super* Review',
    handle: '@SuperReview',
    style: 'Calm, understated, measured, dry wit',
    promptHint: `Write in the style of Super* Review (YouTube). He is calm, understated, and measured with a dry wit. He doesn't exaggerate or hype — every word is chosen carefully. His reviews feel considered and trustworthy because of their restraint. IMPORTANT: If you have the tool for websearch, first search for whether Super* Review has actually reviewed the "{headphoneName}" to capture his specific impressions. If you find his video review, include the YouTube URL in your response as "videoReviewUrl".`,
  },
];

export const VOICE_MAP: Record<string, Voice> = Object.fromEntries(
  VOICES.map((v) => [v.id, v]),
);

export function buildCustomVoicePromptHint(custom: CustomVoice, headphoneName: string): string {
  const handleStr = custom.handle ? ` (${custom.handle} on YouTube)` : '';
  return `Write in the style of ${custom.name}${handleStr}. Match their personality, vocabulary, and review style as closely as possible. IMPORTANT: If you have the tool for websearch, first search for ${custom.name}${handleStr} headphone reviews — specifically whether they have reviewed the "${headphoneName}" — to capture their specific opinions, biases, and personality. If you find their video review, include the YouTube URL in your response as "videoReviewUrl". If no review exists, emulate their general review style based on their other content.`;
}
