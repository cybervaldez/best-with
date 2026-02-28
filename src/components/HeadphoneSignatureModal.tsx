import { useState, useMemo, useRef, useEffect } from 'react';
import type { Headphone, HeadphoneSignature, StrengthBar, BarLevel, CategoryRuleSet, FilterMode, CustomCategoryDef, DerivedCategories } from '../data/types';
import { BAR_LABELS } from '../data/categoryDefaults';
import { generateHeadphoneSignaturePrompt } from '../data/headphonePromptTemplate';
import { parseHeadphoneSignatureJSON } from '../data/headphoneSignatureStorage';
import { deriveCategories, BUILT_IN_PRIORITY } from '../data/headphoneCategory';
import { CATEGORY_LABELS, CategoryBadgeGroup } from './CategoryBadge';
import {
  TICK_LABELS, TICK_POSITIONS, BAR_FREQ_SUBTITLES, BAR_DESCRIPTIONS,
  getSingleReadout, NUMBER_TO_LEVEL, LEVEL_TO_NUMBER,
  levelToPosition, positionToLevel,
} from '../data/barMetadata';

interface Props {
  headphone: Headphone;
  existingSignature: HeadphoneSignature | null;
  categoryRules: CategoryRuleSet;
  filterMode: FilterMode;
  customCategories: CustomCategoryDef[];
  onSave: (signature: HeadphoneSignature) => void;
  onClose: () => void;
}

type Tab = 'manual' | 'llm';

function defaultBars(): Record<string, number> {
  const bars: Record<string, number> = {};
  for (const label of BAR_LABELS) {
    bars[label] = 3;
  }
  return bars;
}

function barsFromSignature(sig: HeadphoneSignature): Record<string, number> {
  const bars: Record<string, number> = {};
  for (const bar of sig.bars) {
    bars[bar.label] = LEVEL_TO_NUMBER[bar.level] ?? 3;
  }
  return bars;
}

function barsToStrengthBars(bars: Record<string, number>): StrengthBar[] {
  return BAR_LABELS.map((label) => ({
    label,
    level: NUMBER_TO_LEVEL[(bars[label] ?? 3) - 1] ?? ('mid' as BarLevel),
  }));
}

function barsFromPreset(category: string, rules: CategoryRuleSet): Record<string, number> {
  const rule = rules[category];
  if (!rule) return defaultBars();
  const newBars: Record<string, number> = {};
  for (const label of BAR_LABELS) {
    const constraint = rule[label];
    newBars[label] = constraint ? Math.round((constraint.min + constraint.max) / 2) : 3;
  }
  return newBars;
}

function barsMatch(a: Record<string, number>, b: Record<string, number>): boolean {
  for (const label of BAR_LABELS) {
    if ((a[label] ?? 3) !== (b[label] ?? 3)) return false;
  }
  return true;
}

export default function HeadphoneSignatureModal({
  headphone, existingSignature, categoryRules, filterMode, customCategories, onSave, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('manual');
  const [bars, setBars] = useState<Record<string, number>>(() =>
    existingSignature ? barsFromSignature(existingSignature) : defaultBars()
  );
  const [tags, setTags] = useState<string[]>(() => existingSignature?.tags ?? []);
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // LLM tab state
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // Drag state
  const dragRef = useRef<{ barLabel: string; trackEl: HTMLElement } | null>(null);
  const barsRef = useRef(bars);
  barsRef.current = bars;

  const prompt = generateHeadphoneSignaturePrompt(headphone);

  const strengthBars = useMemo(() => barsToStrengthBars(bars), [bars]);
  const customIds = useMemo(() => customCategories.map((c) => c.id), [customCategories]);
  const liveCategories: DerivedCategories = useMemo(
    () => deriveCategories(strengthBars, categoryRules, filterMode, customIds),
    [strengthBars, categoryRules, filterMode, customIds],
  );

  const llmValidation = useMemo<
    { valid: true; sig: HeadphoneSignature } | { valid: false; error: string } | null
  >(() => {
    if (!jsonInput.trim()) return null;
    try {
      const sig = parseHeadphoneSignatureJSON(jsonInput, categoryRules, filterMode);
      return { valid: true, sig };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [jsonInput, categoryRules, filterMode]);

  // Detect preset match when bars change
  useEffect(() => {
    for (const cat of BUILT_IN_PRIORITY) {
      if (barsMatch(bars, barsFromPreset(cat, categoryRules))) {
        setActivePreset(cat);
        return;
      }
    }
    setActivePreset('custom');
  }, [bars, categoryRules]);

  // Focus tag input when revealed
  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

  // Drag listeners — track mousedown sets value immediately, hold+move becomes drag
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = drag.trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const level = positionToLevel(pct);
      const current = barsRef.current[drag.barLabel];
      if (level !== current) {
        setBars((prev) => ({ ...prev, [drag.barLabel]: level }));
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
  }, []);

  // Mousedown on track: set value immediately + start drag session
  function handleTrackMouseDown(label: string, e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const trackEl = e.currentTarget;
    const rect = trackEl.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const level = positionToLevel(pct);
    setBars((prev) => ({ ...prev, [label]: level }));
    dragRef.current = { barLabel: label, trackEl };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }


  function handlePreset(category: string) {
    setBars(barsFromPreset(category, categoryRules));
    setActivePreset(category);
  }

  function handleAddTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
    setShowTagInput(false);
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === 'Escape') {
      setTagInput('');
      setShowTagInput(false);
    }
  }

  function handleTagBlur() {
    // Only add if non-empty; always close
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
    setShowTagInput(false);
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleApplyLlm() {
    if (llmValidation?.valid) {
      const sig = llmValidation.sig;
      setBars(barsFromSignature(sig));
      setTags(sig.tags);
      setTab('manual');
    }
  }

  function handleSave() {
    const signature: HeadphoneSignature = {
      tags,
      bars: strengthBars,
      category: liveCategories.primary,
      secondaryCategories: liveCategories.secondary,
    };
    onSave(signature);
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const presetLabel = activePreset === 'custom' ? 'Custom' : (CATEGORY_LABELS[activePreset] ?? activePreset);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel hp-sig-modal" data-testid="hp-sig-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">{headphone.name}</h2>
        <p className="modal-subtitle">{headphone.specs}</p>

        {/* Tab toggle */}
        <div className="hp-sig-tabs" data-testid="hp-sig-tabs">
          <button
            className={`hp-sig-tab${tab === 'manual' ? ' active' : ''}`}
            onClick={() => setTab('manual')}
          >
            Rate Yourself
          </button>
          <button
            className={`hp-sig-tab${tab === 'llm' ? ' active' : ''}`}
            onClick={() => setTab('llm')}
          >
            Use LLM
          </button>
        </div>

        {tab === 'manual' && (
          <div className="hp-sig-manual" data-testid="hp-sig-manual">
            {/* Preset dropdown — retains selected value */}
            <div className="hp-sig-preset-row">
              <label className="hp-sig-preset-label">Preset:</label>
              <select
                className="custom-cat-select"
                value={activePreset}
                onChange={(e) => { if (e.target.value !== 'custom') handlePreset(e.target.value); }}
              >
                <option value="custom">{activePreset === 'custom' ? 'Custom' : `Custom (was ${presetLabel})`}</option>
                {BUILT_IN_PRIORITY.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
                ))}
              </select>
            </div>

            {/* Bar editors */}
            <div className="hp-sig-bars">
              {BAR_LABELS.map((label) => {
                const level = bars[label] ?? 3;
                const readout = getSingleReadout(label, level);
                return (
                  <div className="hp-bar-row" key={label}>
                    <span className="range-label" title={BAR_DESCRIPTIONS[label]}>
                      {label}
                      {BAR_FREQ_SUBTITLES[label] && (
                        <span className="range-label-freq">{BAR_FREQ_SUBTITLES[label]}</span>
                      )}
                    </span>
                    <div className="hp-bar-editor">
                      <div
                        className="range-track"
                        onMouseDown={(e) => handleTrackMouseDown(label, e)}
                        data-testid={`hp-bar-${label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {/* Level ticks */}
                        {TICK_POSITIONS.map((pos, i) => (
                          <div key={i} className="range-tick" style={{ left: `${pos}%` }} />
                        ))}
                        {/* Value marker */}
                        <div
                          className="hp-bar-marker"
                          style={{ left: `${levelToPosition(level)}%` }}
                        />
                      </div>
                      {/* Tick labels — clickable */}
                      <div className="range-tick-labels">
                        {TICK_POSITIONS.map((pos, i) => {
                          const tickLevel = i + 1;
                          return (
                            <span
                              key={i}
                              className={`range-tick-label range-tick-clickable${tickLevel === level ? ' range-tick-active' : ''}`}
                              style={{ left: `${pos}%` }}
                              onClick={() => setBars((prev) => ({ ...prev, [label]: tickLevel }))}
                            >
                              {TICK_LABELS[i]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="range-controls">
                      {readout && <span className="range-hz-readout">{readout}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category + tags inline */}
            <div className="hp-sig-category-preview">
              <span className="hp-sig-category-label">Category:</span>
              <CategoryBadgeGroup primary={liveCategories.primary} secondary={liveCategories.secondary} customCategories={customCategories} />
              <span className="hp-sig-divider" />
              {tags.map((tag) => (
                <span className="tag hp-sig-tag" key={tag}>
                  {tag}
                  <button className="hp-sig-tag-remove" onClick={() => handleRemoveTag(tag)}>&times;</button>
                </span>
              ))}
              {showTagInput ? (
                <span className="tag hp-sig-tag hp-sig-tag-editing">
                  <input
                    ref={tagInputRef}
                    className="hp-sig-tag-input-pill"
                    type="text"
                    placeholder="tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleTagBlur}
                    maxLength={20}
                    data-testid="hp-sig-tag-input"
                  />
                </span>
              ) : (
                <button
                  className="tag hp-sig-tag hp-sig-tag-add-pill"
                  onClick={() => setShowTagInput(true)}
                  title="Add tag"
                >
                  +
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
              <button className="btn-modal primary" onClick={handleSave} data-testid="hp-sig-save">
                {existingSignature ? 'Update Signature' : 'Save Signature'}
              </button>
            </div>
          </div>
        )}

        {tab === 'llm' && (
          <div className="hp-sig-llm" data-testid="hp-sig-llm">
            <p className="modal-description">
              Copy this prompt and paste it into any LLM to analyze <strong>{headphone.name}</strong>.
            </p>
            <textarea className="modal-textarea" readOnly value={prompt} rows={8} />
            <div className="modal-actions" style={{ marginBottom: 'var(--space-4)' }}>
              <button className="btn-modal primary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>

            <p className="modal-description">Paste the JSON response below:</p>
            <textarea
              className="modal-textarea"
              placeholder='{"tags": [...], "bars": [...]}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              data-testid="hp-sig-llm-input"
            />
            {llmValidation && (
              <div className={`modal-validation ${llmValidation.valid ? 'valid' : 'invalid'}`}>
                <span className="modal-validation-icon">{llmValidation.valid ? '\u2713' : '\u2717'}</span>
                <span className="modal-validation-text">
                  {llmValidation.valid
                    ? `Valid — ${CATEGORY_LABELS[llmValidation.sig.category] ?? llmValidation.sig.category}`
                    : llmValidation.error}
                </span>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn-modal primary"
                onClick={handleApplyLlm}
                disabled={!llmValidation?.valid}
                data-testid="hp-sig-apply-llm"
              >
                Apply to Bars &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
