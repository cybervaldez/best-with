import { useState, useEffect, useCallback } from 'react';
import type { Song, Experience, Headphone, SongSignature, HeadphoneSignature, CategoryRuleSet, FilterMode, CustomCategoryDef } from '../data/types';
import { loadSongSignature, saveSongSignature } from '../data/songSignatureStorage';
import { loadHeadphoneSignature, saveHeadphoneSignature } from '../data/headphoneSignatureStorage';
import { loadCategoryRules, saveCategoryRules, loadFilterMode, saveFilterMode, loadCustomCategories, saveCustomCategories } from '../data/categoryRuleStorage';
import { deriveCategories } from '../data/headphoneCategory';
import Sidebar from './Sidebar';
import SongHeader from './SongHeader';
import SongSignatureDisplay from './SongSignatureDisplay';
import SongSignatureModal from './SongSignatureModal';
import HeadphoneSignatureModal from './HeadphoneSignatureModal';
import SignatureManager from './SignatureManager';
import ExperienceMap from './ExperienceMap';
import CopyActions from './CopyActions';

interface Props {
  song: Song;
  songs: Song[];
  selectedIndex: number;
  onSelectSong: (index: number) => void;
  experiences: Experience[];
  headphones: Headphone[];
}

export default function Layout({ song, songs, selectedIndex, onSelectSong, experiences, headphones }: Props) {
  const [signature, setSignature] = useState<SongSignature | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Headphone signatures — single source of truth
  const [hpSignatures, setHpSignatures] = useState<Record<string, HeadphoneSignature>>({});
  const [hpModalTarget, setHpModalTarget] = useState<Headphone | null>(null);

  // Category rules + filter mode + custom categories
  const [categoryRules, setCategoryRules] = useState<CategoryRuleSet>(() => loadCategoryRules());
  const [filterMode, setFilterMode] = useState<FilterMode>(() => loadFilterMode());
  const [customCategories, setCustomCategories] = useState<CustomCategoryDef[]>(() => loadCustomCategories());
  const [showSignatureManager, setShowSignatureManager] = useState(() => window.location.hash === '#signatures');

  // Sync signature manager with URL hash
  const openSignatureManager = useCallback(() => {
    setShowSignatureManager(true);
    window.history.pushState(null, '', '#signatures');
  }, []);

  const closeSignatureManager = useCallback(() => {
    setShowSignatureManager(false);
    if (window.location.hash === '#signatures') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    function onHashChange() {
      setShowSignatureManager(window.location.hash === '#signatures');
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Load song signature when song changes
  useEffect(() => {
    if (song.id) {
      setSignature(loadSongSignature(song.id));
    } else {
      setSignature(null);
    }
    setShowModal(false);
  }, [song.id]);

  // Load all headphone signatures on mount
  useEffect(() => {
    const loaded: Record<string, HeadphoneSignature> = {};
    for (const hp of headphones) {
      const sig = loadHeadphoneSignature(hp.id);
      if (sig) loaded[hp.id] = sig;
    }
    setHpSignatures(loaded);
  }, [headphones]);

  // Re-derive all headphone categories when rules or filter mode change
  const rederiveAll = useCallback((rules: CategoryRuleSet, mode: FilterMode, customCats: CustomCategoryDef[]) => {
    const customIds = customCats.map((c) => c.id);
    setHpSignatures((prev) => {
      const updated = { ...prev };
      let changed = false;
      for (const [id, sig] of Object.entries(updated)) {
        const derived = deriveCategories(sig.bars, rules, mode, customIds);
        if (derived.primary !== sig.category ||
            JSON.stringify(derived.secondary) !== JSON.stringify(sig.secondaryCategories ?? [])) {
          updated[id] = { ...sig, category: derived.primary, secondaryCategories: derived.secondary };
          saveHeadphoneSignature(id, updated[id]);
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, []);

  function handleChangeRules(rules: CategoryRuleSet) {
    setCategoryRules(rules);
    saveCategoryRules(rules);
    rederiveAll(rules, filterMode, customCategories);
  }

  function handleChangeFilterMode(mode: FilterMode) {
    setFilterMode(mode);
    saveFilterMode(mode);
    rederiveAll(categoryRules, mode, customCategories);
  }

  function handleChangeCustomCategories(cats: CustomCategoryDef[]) {
    setCustomCategories(cats);
    saveCustomCategories(cats);
    rederiveAll(categoryRules, filterMode, cats);
  }

  function handleSaveSignature(sig: SongSignature) {
    if (song.id) {
      saveSongSignature(song.id, sig);
      setSignature(sig);
    }
  }

  function handleSaveHpSignature(sig: HeadphoneSignature) {
    if (hpModalTarget) {
      const customIds = customCategories.map((c) => c.id);
      const derived = deriveCategories(sig.bars, categoryRules, filterMode, customIds);
      const withCategory = { ...sig, category: derived.primary, secondaryCategories: derived.secondary };
      saveHeadphoneSignature(hpModalTarget.id, withCategory);
      setHpSignatures((prev) => ({ ...prev, [hpModalTarget.id]: withCategory }));
    }
  }

  return (
    <>
      <div className="ambient-glow" />
      <div className="app-shell">
        <Sidebar
          headphones={headphones}
          songs={songs}
          selectedIndex={selectedIndex}
          onSelectSong={onSelectSong}
          hpSignatures={hpSignatures}
          customCategories={customCategories}
          filterMode={filterMode}
          onChangeFilterMode={handleChangeFilterMode}
          onOpenHpModal={setHpModalTarget}
          onOpenSignatureManager={openSignatureManager}
        />
        <main className="main-content" data-testid="main-content">
          <SongHeader
            song={song}
            signature={signature}
            onGetSignature={() => setShowModal(true)}
          />
          {signature && <SongSignatureDisplay signature={signature} />}
        </main>
        <aside className="experience-column">
          <ExperienceMap experiences={experiences} headphoneSignatures={hpSignatures} customCategories={customCategories} />
          <CopyActions song={song} experiences={experiences} />
        </aside>
      </div>
      {showModal && (
        <SongSignatureModal
          song={song}
          onSave={handleSaveSignature}
          onClose={() => setShowModal(false)}
        />
      )}
      {hpModalTarget && (
        <HeadphoneSignatureModal
          headphone={hpModalTarget}
          existingSignature={hpSignatures[hpModalTarget.id] ?? null}
          categoryRules={categoryRules}
          filterMode={filterMode}
          customCategories={customCategories}
          onSave={handleSaveHpSignature}
          onClose={() => setHpModalTarget(null)}
        />
      )}
      {showSignatureManager && (
        <SignatureManager
          rules={categoryRules}
          customCategories={customCategories}
          onChangeRules={handleChangeRules}
          onChangeCustomCategories={handleChangeCustomCategories}
          onClose={closeSignatureManager}
        />
      )}
    </>
  );
}
