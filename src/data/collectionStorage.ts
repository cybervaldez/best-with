import type { Headphone } from './types';
import { PRESET_MAP } from './presets';
import { loadHeadphoneSignature, saveHeadphoneSignature } from './headphoneSignatureStorage';

const STORAGE_KEY = 'headphone_collection';

const LEGACY_ID_MAP: Record<string, string> = {
  airpods: 'airpods-pro-2',
  xm5: 'wh-1000xm5',
  hd600: 'hd600',
};

export function loadCollection(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
  return [];
}

export function saveCollection(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function addToCollection(id: string): string[] {
  const ids = loadCollection();
  if (!ids.includes(id)) {
    ids.push(id);
    saveCollection(ids);
  }
  return ids;
}

export function removeFromCollection(id: string): string[] {
  const ids = loadCollection().filter((i) => i !== id);
  saveCollection(ids);
  return ids;
}

export function collectionToHeadphones(ids: string[]): Headphone[] {
  return ids
    .map((id) => {
      const preset = PRESET_MAP[id];
      if (!preset) return null;
      return {
        id: preset.id,
        name: preset.name,
        specs: preset.specs,
        dotColor: preset.dotColor,
      };
    })
    .filter((hp): hp is Headphone => hp !== null);
}

export function migrateFromLegacy(): string[] {
  if (localStorage.getItem(STORAGE_KEY)) {
    return loadCollection();
  }

  const legacyRaw = localStorage.getItem('headphones');
  if (!legacyRaw) return [];

  try {
    const legacyIds = JSON.parse(legacyRaw) as string[];
    const newIds: string[] = [];

    for (const oldId of legacyIds) {
      const newId = LEGACY_ID_MAP[oldId];
      if (newId && PRESET_MAP[newId]) {
        newIds.push(newId);
        // Migrate existing signature to new ID
        const existingSig = loadHeadphoneSignature(oldId);
        if (existingSig && oldId !== newId) {
          saveHeadphoneSignature(newId, existingSig);
        }
      }
    }

    if (newIds.length > 0) {
      saveCollection(newIds);
    }
    return newIds;
  } catch {
    return [];
  }
}
