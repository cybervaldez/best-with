import type { HeadphoneBrand, DotColor } from './types';

export const BRAND_META: Record<HeadphoneBrand, { name: string; dotColor: DotColor }> = {
  apple: { name: 'Apple', dotColor: 'blue' },
  sony: { name: 'Sony', dotColor: 'sony' },
  sennheiser: { name: 'Sennheiser', dotColor: 'sennheiser' },
  beyerdynamic: { name: 'Beyerdynamic', dotColor: 'sennheiser' },
  hifiman: { name: 'HiFiMAN', dotColor: 'apple' },
  audeze: { name: 'Audeze', dotColor: 'sony' },
};

export const BRAND_LIST: HeadphoneBrand[] = ['apple', 'sony', 'sennheiser', 'beyerdynamic', 'hifiman', 'audeze'];
