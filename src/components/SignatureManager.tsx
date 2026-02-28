import { useState, useRef, useEffect } from 'react';
import type { HeadphoneCategory, CategoryRuleSet, BarConstraint, CustomCategoryDef } from '../data/types';
import { BAR_LABELS, DEFAULT_CATEGORY_RULES } from '../data/categoryDefaults';
import { CATEGORY_LABELS, isBuiltIn } from './CategoryBadge';
import { BUILT_IN_PRIORITY } from '../data/headphoneCategory';
import {
  TICK_LABELS, TICK_POSITIONS, BAR_FREQ_SUBTITLES, BAR_DESCRIPTIONS,
  getReadout, levelToPosition, positionToLevel,
} from '../data/barMetadata';

interface Props {
  rules: CategoryRuleSet;
  customCategories: CustomCategoryDef[];
  onChangeRules: (rules: CategoryRuleSet) => void;
  onChangeCustomCategories: (cats: CustomCategoryDef[]) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

function constraintCount(rule: Partial<Record<string, BarConstraint>> | undefined): number {
  if (!rule) return 0;
  return Object.values(rule).filter(Boolean).length;
}

function getCategoryColor(cat: string, customCategories: CustomCategoryDef[]): string {
  const colorMap: Record<string, string> = {
    dark: '#a78bfa', bright: '#fbbf24', balanced: '#60a5fa', unmatched: '#94a3b8',
    'v-shaped': '#f472b6', warm: '#fb923c', analytical: '#2dd4bf', intimate: '#e879f9',
  };
  if (colorMap[cat]) return colorMap[cat];
  const custom = customCategories.find((c) => c.id === cat);
  return custom?.color ?? '#94a3b8';
}

export default function SignatureManager({
  rules, customCategories, onChangeRules, onChangeCustomCategories, onClose,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<HeadphoneCategory>('dark');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatBase, setNewCatBase] = useState('');
  const [hoverInfo, setHoverInfo] = useState<{ barLabel: string; level: number } | null>(null);

  const currentRule = rules[activeCategory] ?? {};
  const isCustomActive = !isBuiltIn(activeCategory);

  // Refs for drag — avoids stale closures in global event handlers
  const dragRef = useRef<{
    barLabel: string;
    handle: 'min' | 'max';
    trackEl: HTMLElement;
  } | null>(null);
  const rulesRef = useRef(rules);
  const activeCatRef = useRef(activeCategory);
  rulesRef.current = rules;
  activeCatRef.current = activeCategory;

  function updateConstraint(barLabel: string, constraint: BarConstraint | null) {
    const latestRules = rulesRef.current;
    const cat = activeCatRef.current;
    const rule = latestRules[cat] ?? {};
    const newRule = { ...rule };
    if (constraint === null) {
      delete newRule[barLabel];
    } else {
      newRule[barLabel] = constraint;
    }
    onChangeRules({ ...latestRules, [cat]: newRule });
  }

  // Mousedown on track: set value immediately + start drag session
  function handleTrackMouseDown(barLabel: string, e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const trackEl = e.currentTarget;
    const rect = trackEl.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const level = positionToLevel(pct);
    const cat = activeCatRef.current;
    const existing = rulesRef.current[cat]?.[barLabel];
    let handle: 'min' | 'max';
    if (!existing) {
      updateConstraint(barLabel, { min: level, max: level, gradient: 1 });
      handle = 'max';
    } else {
      const rangeMid = (existing.min + existing.max) / 2;
      if (level <= rangeMid) {
        updateConstraint(barLabel, { ...existing, min: Math.min(level, existing.max) });
        handle = 'min';
      } else {
        updateConstraint(barLabel, { ...existing, max: Math.max(level, existing.min) });
        handle = 'max';
      }
    }
    dragRef.current = { barLabel, handle, trackEl };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function handleTrackHover(barLabel: string, e: React.MouseEvent<HTMLDivElement>) {
    if (dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const level = positionToLevel(pct);
    setHoverInfo({ barLabel, level });
  }

  function handleTrackLeave() {
    setHoverInfo(null);
  }

  // Start dragging a bracket handle
  function handleBracketMouseDown(barLabel: string, handle: 'min' | 'max', e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trackEl = (e.currentTarget as HTMLElement).parentElement;
    if (!trackEl) return;
    dragRef.current = { barLabel, handle, trackEl };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = drag.trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const level = positionToLevel(pct);
      const cat = activeCatRef.current;
      const rule = rulesRef.current[cat] ?? {};
      const existing = rule[drag.barLabel];
      if (!existing) return;

      if (drag.handle === 'min') {
        const clamped = Math.min(level, existing.max);
        if (clamped !== existing.min) {
          updateConstraint(drag.barLabel, { ...existing, min: clamped });
        }
      } else {
        const clamped = Math.max(level, existing.min);
        if (clamped !== existing.max) {
          updateConstraint(drag.barLabel, { ...existing, max: clamped });
        }
      }
    }

    function handleMouseUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onChangeRules]);

  function handleReset() {
    if (isCustomActive) {
      onChangeRules({ ...rules, [activeCategory]: {} });
    } else {
      const defaults = structuredClone(DEFAULT_CATEGORY_RULES);
      onChangeRules({ ...rules, [activeCategory]: defaults[activeCategory] ?? {} });
    }
  }

  function handleAddCustom() {
    const name = newCatName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    const desc = newCatDesc.trim() || undefined;
    const newCat: CustomCategoryDef = { id, name, color: newCatColor, description: desc };
    onChangeCustomCategories([...customCategories, newCat]);
    const baseRules = newCatBase && rules[newCatBase] ? structuredClone(rules[newCatBase]) : {};
    onChangeRules({ ...rules, [id]: baseRules });
    setActiveCategory(id);
    setShowAddForm(false);
    setNewCatName('');
    setNewCatColor(PRESET_COLORS[0]);
    setNewCatDesc('');
    setNewCatBase('');
  }

  function handleDeleteCustom() {
    if (!isCustomActive) return;
    onChangeCustomCategories(customCategories.filter((c) => c.id !== activeCategory));
    const newRules = { ...rules };
    delete newRules[activeCategory];
    onChangeRules(newRules);
    setActiveCategory('dark');
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const catColor = getCategoryColor(activeCategory, customCategories);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel sig-manager-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">Signature Manager</h2>

        {/* Category tabs */}
        <div className="category-tabs">
          {BUILT_IN_PRIORITY.map((cat) => {
            const count = constraintCount(rules[cat]);
            return (
              <button
                key={cat}
                className={`category-badge category-${cat}${cat === activeCategory ? ' category-tab-active' : ''}`}
                onClick={() => { setActiveCategory(cat); setShowAddForm(false); }}
              >
                {CATEGORY_LABELS[cat]}{count > 0 && ` (${count})`}
              </button>
            );
          })}
          {customCategories.map((cat) => {
            const count = constraintCount(rules[cat.id]);
            return (
              <button
                key={cat.id}
                className={`category-badge${cat.id === activeCategory ? ' category-tab-active' : ''}`}
                style={{
                  color: cat.color,
                  background: `${cat.color}1f`,
                  border: `1px solid ${cat.color}40`,
                }}
                onClick={() => { setActiveCategory(cat.id); setShowAddForm(false); }}
              >
                {cat.name}{count > 0 && ` (${count})`}
              </button>
            );
          })}
          <button
            className="category-badge category-add-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add custom category"
          >
            +
          </button>
        </div>

        {/* Add custom category form */}
        {showAddForm && (
          <div className="custom-cat-form">
            <input
              className="custom-cat-input"
              type="text"
              placeholder="Category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <input
              className="custom-cat-input"
              type="text"
              placeholder="Description (optional)..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              maxLength={60}
            />
            <div className="custom-cat-colors">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch${c === newCatColor ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewCatColor(c)}
                />
              ))}
            </div>
            <select
              className="custom-cat-select"
              value={newCatBase}
              onChange={(e) => setNewCatBase(e.target.value)}
            >
              <option value="">Start from scratch</option>
              {BUILT_IN_PRIORITY.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
              ))}
              {customCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="custom-cat-actions">
              <button
                className="btn-modal primary"
                onClick={handleAddCustom}
                disabled={!newCatName.trim()}
              >
                Add Category
              </button>
              <button className="btn-modal secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Custom category description */}
        {isCustomActive && (() => {
          const activeCat = customCategories.find((c) => c.id === activeCategory);
          return activeCat?.description ? (
            <p className="custom-cat-desc">{activeCat.description}</p>
          ) : null;
        })()}

        {/* Bar range editors */}
        <div className="sig-manager-bars">
          {BAR_LABELS.map((label) => {
            const constraint = currentRule[label];
            return (
              <div className="range-row" key={label}>
                <span className="range-label" title={BAR_DESCRIPTIONS[label]}>
                  {label}
                  {BAR_FREQ_SUBTITLES[label] && (
                    <span className="range-label-freq">{BAR_FREQ_SUBTITLES[label]}</span>
                  )}
                </span>
                <div className="range-editor">
                  <div
                    className={`range-track${!constraint ? ' range-track-empty' : ''}`}
                    onMouseDown={(e) => handleTrackMouseDown(label, e)}
                    onMouseMove={(e) => handleTrackHover(label, e)}
                    onMouseLeave={handleTrackLeave}
                  >
                    {/* Gradient fade zones — always visible to show tolerance range */}
                    {constraint && constraint.gradient > 0 && (() => {
                      const alpha = constraint.gradient >= 2 ? '4d' : '33';
                      const bandLeft = levelToPosition(constraint.min);
                      const bandRight = levelToPosition(constraint.max);
                      const fadeLeft = levelToPosition(Math.max(1, constraint.min - constraint.gradient));
                      const fadeRight = levelToPosition(Math.min(5, constraint.max + constraint.gradient));
                      return (
                        <>
                          {fadeLeft < bandLeft && (
                            <div
                              className="range-gradient"
                              style={{
                                left: `${fadeLeft}%`,
                                width: `${bandLeft - fadeLeft}%`,
                                background: `linear-gradient(to right, transparent, ${catColor}${alpha})`,
                              }}
                            />
                          )}
                          {fadeRight > bandRight && (
                            <div
                              className="range-gradient"
                              style={{
                                left: `${bandRight}%`,
                                width: `${fadeRight - bandRight}%`,
                                background: `linear-gradient(to right, ${catColor}${alpha}, transparent)`,
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                    {/* Hover preview — ghost band (expand) or fadeout (shrink) */}
                    {hoverInfo && hoverInfo.barLabel === label && (() => {
                      const hLvl = hoverInfo.level;
                      const hPos = levelToPosition(hLvl);
                      if (!constraint) {
                        // Empty bar: ghost band dot at hovered level
                        return (
                          <div
                            className="range-band range-band-ghost"
                            style={{
                              left: `${hPos}%`,
                              width: '0%',
                              background: catColor,
                              minWidth: '4px',
                            }}
                          />
                        );
                      }
                      // Existing constraint: determine expand vs shrink
                      const rangeMid = (constraint.min + constraint.max) / 2;
                      const isMin = hLvl <= rangeMid;
                      const newMin = isMin ? Math.min(hLvl, constraint.max) : constraint.min;
                      const newMax = isMin ? constraint.max : Math.max(hLvl, constraint.min);
                      if (newMin === constraint.min && newMax === constraint.max) return null;
                      const isShrink = newMin > constraint.min || newMax < constraint.max;
                      if (isShrink) {
                        // Show fadeout on the area that would be removed
                        const fadeLeft = newMin > constraint.min
                          ? levelToPosition(constraint.min)
                          : levelToPosition(newMax);
                        const fadeRight = newMin > constraint.min
                          ? levelToPosition(newMin)
                          : levelToPosition(constraint.max);
                        return (
                          <div
                            className="range-band-fadeout"
                            style={{
                              left: `${fadeLeft}%`,
                              width: `${Math.max(0, fadeRight - fadeLeft)}%`,
                              minWidth: '4px',
                            }}
                          />
                        );
                      }
                      // Expand: ghost band showing new range
                      const ghostLeft = levelToPosition(newMin);
                      const ghostRight = levelToPosition(newMax);
                      return (
                        <div
                          className="range-band range-band-ghost"
                          style={{
                            left: `${ghostLeft}%`,
                            width: `${ghostRight - ghostLeft}%`,
                            background: catColor,
                            minWidth: '4px',
                          }}
                        />
                      );
                    })()}
                    {/* Precise range band */}
                    {constraint && (
                      <div
                        className="range-band"
                        style={{
                          left: `${levelToPosition(constraint.min)}%`,
                          width: `${levelToPosition(constraint.max) - levelToPosition(constraint.min)}%`,
                          background: catColor,
                          boxShadow: `0 0 4px ${catColor}`,
                          minWidth: '4px',
                        }}
                      />
                    )}
                    {/* Level ticks */}
                    {TICK_POSITIONS.map((pos, i) => (
                      <div
                        key={i}
                        className="range-tick"
                        style={{ left: `${pos}%` }}
                      />
                    ))}
                    {/* Bracket handles — draggable */}
                    {constraint && (
                      <>
                        <div
                          className="range-bracket range-bracket-left"
                          style={{
                            left: `${levelToPosition(constraint.min)}%`,
                            '--bracket-color': catColor,
                          } as React.CSSProperties}
                          title={`Min: ${TICK_LABELS[constraint.min - 1]}`}
                          onMouseDown={(e) => handleBracketMouseDown(label, 'min', e)}
                        />
                        <div
                          className="range-bracket range-bracket-right"
                          style={{
                            left: `${levelToPosition(constraint.max)}%`,
                            '--bracket-color': catColor,
                          } as React.CSSProperties}
                          title={`Max: ${TICK_LABELS[constraint.max - 1]}`}
                          onMouseDown={(e) => handleBracketMouseDown(label, 'max', e)}
                        />
                      </>
                    )}
                  </div>
                  {/* Tick labels row — clickable */}
                  <div className="range-tick-labels">
                    {TICK_POSITIONS.map((pos, i) => {
                      const tickLevel = i + 1;
                      const inRange = constraint
                        ? tickLevel >= constraint.min && tickLevel <= constraint.max
                        : false;
                      return (
                        <span
                          key={i}
                          className={`range-tick-label range-tick-clickable${inRange ? ' range-tick-active' : ''}`}
                          style={{ left: `${pos}%` }}
                          onClick={() => {
                            if (!constraint) {
                              updateConstraint(label, { min: tickLevel, max: tickLevel, gradient: 1 });
                            } else {
                              const rangeMid = (constraint.min + constraint.max) / 2;
                              if (tickLevel <= rangeMid) {
                                updateConstraint(label, { ...constraint, min: Math.min(tickLevel, constraint.max) });
                              } else {
                                updateConstraint(label, { ...constraint, max: Math.max(tickLevel, constraint.min) });
                              }
                            }
                          }}
                        >
                          {TICK_LABELS[i]}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {/* Hz readout + remove */}
                {constraint ? (
                  <div className="range-controls">
                    {(() => {
                      const readout = getReadout(label, constraint.min, constraint.max);
                      return readout ? <span className="range-hz-readout">{readout}</span> : null;
                    })()}
                    <button
                      className="range-remove"
                      onClick={() => updateConstraint(label, null)}
                      title="Remove constraint"
                    >&times;</button>
                  </div>
                ) : (
                  <div className="range-controls" />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button className="btn-modal secondary" onClick={handleReset}>
              {isCustomActive ? 'Clear All' : 'Reset to Defaults'}
            </button>
            {isCustomActive && (
              <button className="btn-modal danger" onClick={handleDeleteCustom}>
                Delete Category
              </button>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-modal primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
