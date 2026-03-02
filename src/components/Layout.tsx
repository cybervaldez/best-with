import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Song, Headphone, SongSignature, HeadphoneSignature, ExperienceNote, CategoryRuleSet, FilterMode, CustomCategoryDef } from '../data/types';
import { loadSongSignature, saveSongSignature } from '../data/songSignatureStorage';
import { loadHeadphoneSignature, saveHeadphoneSignature } from '../data/headphoneSignatureStorage';
import { loadCategoryRules, saveCategoryRules, loadFilterMode, saveFilterMode, loadCustomCategories, saveCustomCategories } from '../data/categoryRuleStorage';
import { deriveCategories } from '../data/headphoneCategory';
import { loadCollection, addToCollection, removeFromCollection, collectionToHeadphones, migrateFromLegacy } from '../data/collectionStorage';
import { loadExperienceNote, saveExperienceNote } from '../data/experienceStorage';
import { PRESET_MAP } from '../data/presets';
import { buildSpectrum, presetToHeadphone, presetToSignature, loadSpectrumSelections, saveSpectrumSelections } from '../data/spectrumBuilder';
import Sidebar from './Sidebar';
import SongHeader from './SongHeader';
import SongSignatureDisplay from './SongSignatureDisplay';
import SongSignatureModal from './SongSignatureModal';
import HeadphoneSignatureModal from './HeadphoneSignatureModal';
import EditExperienceModal from './EditExperienceModal';
import AddHeadphoneModal from './AddHeadphoneModal';
import SignatureManager from './SignatureManager';
import ExperienceMap from './ExperienceMap';

interface Props {
  song: Song;
  songs: Song[];
  selectedIndex: number;
  onSelectSong: (index: number) => void;
}

export default function Layout({ song, songs, selectedIndex, onSelectSong }: Props) {
  // Collection state — persisted in localStorage
  const [collectionIds, setCollectionIds] = useState<string[]>(() => {
    const migrated = migrateFromLegacy();
    return migrated.length > 0 ? migrated : loadCollection();
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const headphones = useMemo(() => collectionToHeadphones(collectionIds), [collectionIds]);

  const [signature, setSignature] = useState<SongSignature | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Headphone signatures — single source of truth
  const [hpSignatures, setHpSignatures] = useState<Record<string, HeadphoneSignature>>({});
  const [hpModalTarget, setHpModalTarget] = useState<Headphone | null>(null);

  // Experience notes — per song+headphone pair
  const [experienceNotes, setExperienceNotes] = useState<Record<string, ExperienceNote | null>>({});
  const [editExpTarget, setEditExpTarget] = useState<Headphone | null>(null);

  // Spectrum view state
  const [expViewMode, setExpViewMode] = useState<'palette' | 'mine'>('palette');
  const [spectrumSelections, setSpectrumSelections] = useState<Record<string, string>>(
    () => loadSpectrumSelections(),
  );

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

  // ── Spectrum computed values ──
  const spectrumSlots = useMemo(
    () => buildSpectrum(collectionIds, hpSignatures, spectrumSelections),
    [collectionIds, hpSignatures, spectrumSelections],
  );

  const spectrumHeadphones = useMemo(() => {
    const result: Record<string, Headphone> = {};
    for (const slot of spectrumSlots) {
      if (slot.presetId) {
        const hp = presetToHeadphone(slot.presetId);
        if (hp) result[slot.presetId] = hp;
      }
    }
    return result;
  }, [spectrumSlots]);

  const spectrumSignatures = useMemo(() => {
    const result: Record<string, HeadphoneSignature> = {};
    for (const slot of spectrumSlots) {
      if (!slot.presetId) continue;
      if (hpSignatures[slot.presetId]) {
        result[slot.presetId] = hpSignatures[slot.presetId];
      } else {
        const sig = presetToSignature(slot.presetId);
        if (sig) result[slot.presetId] = sig;
      }
    }
    return result;
  }, [spectrumSlots, hpSignatures]);

  // Load experience notes for collection + visible spectrum headphones
  useEffect(() => {
    if (!song.id) {
      setExperienceNotes({});
      return;
    }
    const ids = new Set<string>();
    for (const hp of headphones) {
      ids.add(hp.id);
    }
    for (const slot of spectrumSlots) {
      if (slot.presetId) ids.add(slot.presetId);
    }
    const notes: Record<string, ExperienceNote | null> = {};
    for (const id of ids) {
      notes[id] = loadExperienceNote(song.id, id);
    }
    setExperienceNotes(notes);
  }, [song.id, headphones, spectrumSlots]);

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

  function handleAddHeadphone(presetId: string) {
    const newIds = addToCollection(presetId);
    setCollectionIds([...newIds]);
    // Initialize with preset baseline signature if no existing signature
    const preset = PRESET_MAP[presetId];
    if (preset && !hpSignatures[presetId]) {
      const customIds = customCategories.map((c) => c.id);
      const derived = deriveCategories(preset.baseline.bars, categoryRules, filterMode, customIds);
      const presetPerspective = {
        perspectiveId: 'preset-' + Date.now(),
        label: preset.name,
        tags: [...preset.baseline.tags],
        bars: [...preset.baseline.bars],
        category: derived.primary,
        secondaryCategories: derived.secondary,
        source: 'preset' as const,
      };
      const sig: HeadphoneSignature = {
        tags: [...preset.baseline.tags],
        bars: [...preset.baseline.bars],
        category: derived.primary,
        secondaryCategories: derived.secondary,
        perspectives: [presetPerspective],
        defaultPerspectiveId: presetPerspective.perspectiveId,
      };
      saveHeadphoneSignature(presetId, sig);
      setHpSignatures((prev) => ({ ...prev, [presetId]: sig }));
    }
  }

  function handleRemoveHeadphone(presetId: string) {
    const newIds = removeFromCollection(presetId);
    setCollectionIds([...newIds]);
  }

  function handleSaveExperienceNote(note: ExperienceNote) {
    if (song.id && editExpTarget) {
      saveExperienceNote(song.id, editExpTarget.id, note);
      setExperienceNotes((prev) => ({ ...prev, [editExpTarget.id]: note }));
    }
  }

  function handleRerollSlot(category: string) {
    const slot = spectrumSlots.find((s) => s.category === category);
    if (!slot || slot.alternatives.length === 0) return;
    const next = slot.alternatives[Math.floor(Math.random() * slot.alternatives.length)];
    const updated = { ...spectrumSelections, [category]: next };
    setSpectrumSelections(updated);
    saveSpectrumSelections(updated);
  }

  // Resolve signature for edit target from either collection or spectrum
  const editTargetSig = editExpTarget
    ? (hpSignatures[editExpTarget.id] ?? spectrumSignatures[editExpTarget.id] ?? null)
    : null;

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
          onOpenAddModal={() => setShowAddModal(true)}
          onRemoveHeadphone={handleRemoveHeadphone}
        />
        <main className="main-content" data-testid="main-content">
          <SongHeader
            song={song}
            signature={signature}
            onGetSignature={() => setShowModal(true)}
          />
          {signature && <SongSignatureDisplay signature={signature} onEdit={() => setShowModal(true)} onSave={handleSaveSignature} />}
        </main>
        <aside className="experience-column">
          <ExperienceMap
            headphones={headphones}
            songSignature={signature}
            headphoneSignatures={hpSignatures}
            experienceNotes={experienceNotes}
            onEditExperience={setEditExpTarget}
            onSetHpSignature={setHpModalTarget}
            onSaveHpSignature={(hpId, sig) => {
              const customIds = customCategories.map((c) => c.id);
              const derived = deriveCategories(sig.bars, categoryRules, filterMode, customIds);
              const withCategory = { ...sig, category: derived.primary, secondaryCategories: derived.secondary };
              saveHeadphoneSignature(hpId, withCategory);
              setHpSignatures((prev) => ({ ...prev, [hpId]: withCategory }));
            }}
            viewMode={expViewMode}
            onToggleView={setExpViewMode}
            spectrumSlots={spectrumSlots}
            spectrumHeadphones={spectrumHeadphones}
            spectrumSignatures={spectrumSignatures}
            onRerollSlot={handleRerollSlot}
          />
        </aside>
      </div>
      {showModal && (
        <SongSignatureModal
          song={song}
          existingSignature={signature}
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
      {showAddModal && (
        <AddHeadphoneModal
          collectionIds={collectionIds}
          onAdd={handleAddHeadphone}
          onRemove={handleRemoveHeadphone}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editExpTarget && signature && editTargetSig && (
        <EditExperienceModal
          song={song}
          songSignature={signature}
          headphone={editExpTarget}
          hpSignature={editTargetSig}
          existingNote={experienceNotes[editExpTarget.id] ?? null}
          onSave={handleSaveExperienceNote}
          onClose={() => setEditExpTarget(null)}
        />
      )}
    </>
  );
}
