import { useState, useMemo } from 'react';
import type { HeadphoneFormFactor, HeadphoneBrand } from '../data/types';
import { PRESETS, getPresetsByBrand } from '../data/presets';
import { BRAND_META, BRAND_LIST } from '../data/brandMeta';

interface Props {
  collectionIds: string[];
  onAdd: (presetId: string) => void;
  onRemove: (presetId: string) => void;
  onClose: () => void;
}

type FormFactorFilter = 'all' | HeadphoneFormFactor;

const FORM_FACTOR_LABELS: Record<FormFactorFilter, string> = {
  all: 'All',
  'over-ear': 'Over-ear',
  'on-ear': 'On-ear',
  iem: 'IEM',
  tws: 'TWS',
  earbud: 'Earbud',
};

// Only show form factors that exist in presets
function getAvailableFormFactors(brand: HeadphoneBrand): FormFactorFilter[] {
  const presets = getPresetsByBrand(brand);
  const factors = new Set(presets.map((p) => p.formFactor));
  const available: FormFactorFilter[] = ['all'];
  for (const ff of ['over-ear', 'on-ear', 'iem', 'tws', 'earbud'] as HeadphoneFormFactor[]) {
    if (factors.has(ff)) available.push(ff);
  }
  return available;
}

export default function AddHeadphoneModal({ collectionIds, onAdd, onRemove, onClose }: Props) {
  const [activeBrand, setActiveBrand] = useState<HeadphoneBrand>('apple');
  const [formFactorFilter, setFormFactorFilter] = useState<FormFactorFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const collectionSet = useMemo(() => new Set(collectionIds), [collectionIds]);

  const isSearching = searchQuery.trim().length > 0;

  const availableFilters = useMemo(
    () => getAvailableFormFactors(activeBrand),
    [activeBrand],
  );

  const filteredPresets = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      return PRESETS.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q) ||
        p.baseline.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const brandPresets = getPresetsByBrand(activeBrand);
    if (formFactorFilter === 'all') return brandPresets;
    return brandPresets.filter((p) => p.formFactor === formFactorFilter);
  }, [activeBrand, formFactorFilter, searchQuery, isSearching]);

  // Check if a brand has presets
  const brandsWithPresets = useMemo(() => {
    const set = new Set<HeadphoneBrand>();
    for (const p of PRESETS) set.add(p.brand);
    return set;
  }, []);

  function handleBrandClick(brand: HeadphoneBrand) {
    if (!brandsWithPresets.has(brand)) return;
    setActiveBrand(brand);
    setFormFactorFilter('all');
    setSearchQuery('');
  }

  function handleCardClick(presetId: string) {
    if (collectionSet.has(presetId)) {
      onRemove(presetId);
    } else {
      onAdd(presetId);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel add-hp-modal" data-testid="add-hp-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">Add Headphone</h2>
        <p className="modal-subtitle">Browse presets and add to your collection</p>

        {/* Search */}
        <input
          className="add-hp-search"
          type="text"
          placeholder="Search by name, specs, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="add-hp-search"
        />

        {/* Brand tabs */}
        <div className={`add-hp-brands${isSearching ? ' dimmed' : ''}`}>
          {BRAND_LIST.map((brand) => {
            const hasBrand = brandsWithPresets.has(brand);
            const isActive = brand === activeBrand;
            const cls = `add-hp-brand-tab${isActive ? ' active' : ''}${!hasBrand ? ' disabled' : ''}`;
            return (
              <button
                key={brand}
                className={cls}
                onClick={() => handleBrandClick(brand)}
                title={hasBrand ? BRAND_META[brand].name : `${BRAND_META[brand].name} — Coming Soon`}
              >
                {BRAND_META[brand].name}
                {!hasBrand && <span style={{ fontSize: '0.6rem', marginLeft: 4, opacity: 0.6 }}>Soon</span>}
              </button>
            );
          })}
        </div>

        {/* Form factor filters */}
        <div className={`add-hp-filters${isSearching ? ' dimmed' : ''}`}>
          {availableFilters.map((ff) => (
            <button
              key={ff}
              className={`add-hp-filter-pill${formFactorFilter === ff ? ' active' : ''}`}
              onClick={() => setFormFactorFilter(ff)}
            >
              {FORM_FACTOR_LABELS[ff]}
            </button>
          ))}
        </div>

        {/* Preset grid */}
        <div className="add-hp-grid">
          {filteredPresets.length === 0 && (
            <div className="add-hp-empty">{isSearching ? `No results for "${searchQuery.trim()}"` : 'No presets match this filter'}</div>
          )}
          {filteredPresets.map((preset) => {
            const inCollection = collectionSet.has(preset.id);
            return (
              <div
                key={preset.id}
                className={`add-hp-card${inCollection ? ' in-collection' : ''}`}
                onClick={() => handleCardClick(preset.id)}
                data-testid={`add-hp-card-${preset.id}`}
              >
                <div className="add-hp-card-name">{preset.name}</div>
                <div className="add-hp-card-specs">{preset.specs}</div>
                <div className="add-hp-card-badges">
                  <span className="add-hp-badge">{preset.formFactor}</span>
                  {preset.baseline.tags[0] && (
                    <span className="add-hp-badge">{preset.baseline.tags[0]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
