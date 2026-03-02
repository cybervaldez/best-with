import { useState, useMemo, useRef, useEffect } from 'react';
import type { Headphone, HeadphoneSignature, HeadphoneCategory, StrengthBar, BarLevel, CategoryRuleSet, FilterMode, CustomCategoryDef, DerivedCategories, SignaturePerspective, LlmTag } from '../data/types';
import { BAR_LABELS } from '../data/categoryDefaults';
import { generateHeadphoneSignaturePrompt } from '../data/headphonePromptTemplate';
import { parseHeadphoneSignatureJSON } from '../data/headphoneSignatureStorage';
import { deriveCategories, BUILT_IN_PRIORITY } from '../data/headphoneCategory';
import { PRESET_MAP } from '../data/presets';
import { CATEGORY_LABELS, CategoryBadgeGroup } from './CategoryBadge';
import {
  TICK_LABELS, TICK_POSITIONS, BAR_FREQ_SUBTITLES, BAR_DESCRIPTIONS,
  getSingleReadout, NUMBER_TO_LEVEL, LEVEL_TO_NUMBER,
  levelToPosition, positionToLevel,
} from '../data/barMetadata';
import { LLM_TAG_OPTIONS } from '../data/voices';
import { getApiKey } from '../data/preferencesStorage';
import { generateWithApiKey, extractJSON } from '../data/llmApi';
import ApiKeyPreferencesModal from './ApiKeyPreferencesModal';

interface Props {
  headphone: Headphone;
  existingSignature: HeadphoneSignature | null;
  categoryRules: CategoryRuleSet;
  filterMode: FilterMode;
  customCategories: CustomCategoryDef[];
  onSave: (signature: HeadphoneSignature) => void;
  onClose: () => void;
}

type ModalView = 'choose' | 'ai' | 'tabs';
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
  const [modalView, setModalView] = useState<ModalView>(existingSignature ? 'tabs' : 'choose');
  const [tab, setTab] = useState<Tab>('manual');
  const [bars, setBars] = useState<Record<string, number>>(() =>
    existingSignature ? barsFromSignature(existingSignature) : defaultBars()
  );
  const [tags, setTags] = useState<string[]>(() => existingSignature?.tags ?? []);
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // LLM / AI view state
  const [llmStep, setLlmStep] = useState<'copy' | 'paste'>('copy');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedLlmTag, setSelectedLlmTag] = useState<LlmTag>('other');
  const [latestSig, setLatestSig] = useState<HeadphoneSignature | null>(existingSignature);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [presetPerspective, setPresetPerspective] = useState<SignaturePerspective | null>(
    () => existingSignature?.perspectives.find(p => p.source === 'preset') ?? null
  );

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

  const availableProvider = LLM_TAG_OPTIONS.find(o => o.id !== 'other' && getApiKey(o.id));
  const hasApiKey = !!availableProvider;

  async function handleCopyAi() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setLlmStep('paste');
    }, 600);
  }

  async function handleRecopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateAi() {
    if (!availableProvider) return;
    const apiKey = getApiKey(availableProvider.id);
    if (!apiKey) return;

    setGenerating(true);
    setGenerateError(null);
    setSelectedLlmTag(availableProvider.id);

    const result = await generateWithApiKey(availableProvider.id, apiKey, prompt);
    setGenerating(false);

    if (!result.ok) {
      setGenerateError(result.error.message);
      return;
    }

    setJsonInput(extractJSON(result.text));
    setLlmStep('paste');
  }

  async function handleGenerate() {
    if (!availableProvider) return;
    const apiKey = getApiKey(availableProvider.id);
    if (!apiKey) return;

    setGenerating(true);
    setGenerateError(null);
    setSelectedLlmTag(availableProvider.id);

    const result = await generateWithApiKey(availableProvider.id, apiKey, prompt);
    setGenerating(false);

    if (!result.ok) {
      setGenerateError(result.error.message);
      return;
    }

    setJsonInput(extractJSON(result.text));
  }

  function handleApplyLlm() {
    if (!llmValidation?.valid) return;
    const sig = llmValidation.sig;

    // Create LLM perspective with tag — label "Consensus" per audiophile convention
    const llmPerspective: SignaturePerspective = {
      perspectiveId: 'llm-' + Date.now(),
      label: 'Consensus',
      tags: sig.tags,
      bars: sig.bars,
      category: sig.category,
      secondaryCategories: sig.secondaryCategories,
      source: 'llm',
      llmTag: selectedLlmTag,
    };

    // Save immediately with LLM perspective — keep existing manual + preset
    const existingManual = latestSig?.perspectives.filter(p => p.source === 'manual') ?? [];
    const existingPreset = latestSig?.perspectives.filter(p => p.source === 'preset') ?? [];
    const merged: HeadphoneSignature = {
      ...sig,
      perspectives: [llmPerspective, ...existingPreset, ...existingManual],
      defaultPerspectiveId: llmPerspective.perspectiveId,
    };
    onSave(merged);
    setLatestSig(merged);

    // Pre-fill refine tab
    setBars(barsFromSignature(sig));
    setTags(sig.tags);
    setModalView('tabs');
    setTab('manual');
  }

  const preset = PRESET_MAP[headphone.id];

  function handleResetToPreset() {
    if (!preset) return;
    const newBars: Record<string, number> = {};
    for (const bar of preset.baseline.bars) {
      newBars[bar.label] = LEVEL_TO_NUMBER[bar.level] ?? 3;
    }
    setBars(newBars);
    setTags([...preset.baseline.tags]);
  }

  function handleSave() {
    const existingManualP = latestSig?.perspectives.find(p => p.source === 'manual');

    // Collect base perspectives (LLM + preset)
    const existingLlm = latestSig?.perspectives.filter(p => p.source === 'llm') ?? [];
    const savedPresets = latestSig?.perspectives.filter(p => p.source === 'preset') ?? [];
    // Include preset from choice screen if not already saved
    const allPresets = presetPerspective && !savedPresets.some(p => p.perspectiveId === presetPerspective.perspectiveId)
      ? [...savedPresets, presetPerspective]
      : savedPresets;

    // Determine base for refinedFrom (LLM takes precedence, then preset)
    const base = existingLlm[0] ?? allPresets[allPresets.length - 1] ?? null;

    const manualPerspective: SignaturePerspective = {
      perspectiveId: existingManualP?.perspectiveId ?? 'manual-' + Date.now(),
      label: 'My Take',
      tags,
      bars: strengthBars,
      category: liveCategories.primary,
      secondaryCategories: liveCategories.secondary,
      source: 'manual',
      ...(base ? { refinedFrom: base.perspectiveId } : {}),
    };

    const allPerspectives = [...existingLlm, ...allPresets, manualPerspective];
    const defaultId = latestSig?.defaultPerspectiveId ?? manualPerspective.perspectiveId;
    const defaultP = allPerspectives.find(p => p.perspectiveId === defaultId) ?? manualPerspective;

    const signature: HeadphoneSignature = {
      tags: defaultP.tags,
      bars: defaultP.bars,
      category: defaultP.category ?? liveCategories.primary,
      secondaryCategories: defaultP.secondaryCategories ?? liveCategories.secondary,
      perspectives: allPerspectives,
      defaultPerspectiveId: defaultId,
    };
    onSave(signature);
    onClose();
  }

  function handleChoosePreset(category: string) {
    const presetBars = barsFromPreset(category, categoryRules);
    setBars(presetBars);
    setActivePreset(category);

    const presetP: SignaturePerspective = {
      perspectiveId: 'preset-' + Date.now(),
      label: CATEGORY_LABELS[category] ?? category,
      tags: [],
      bars: barsToStrengthBars(presetBars),
      category: category as HeadphoneCategory,
      source: 'preset',
    };
    setPresetPerspective(presetP);

    setModalView('tabs');
    setTab('manual');
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

        {modalView === 'choose' ? (
          <div className="sig-choose-screen" data-testid="hp-sig-choose">
            <p className="sig-choose-subtitle">Pick a starting point</p>
            <div className="sig-preset-grid" data-testid="hp-sig-preset-grid">
              {BUILT_IN_PRIORITY.map((cat) => (
                <button
                  key={cat}
                  className={`sig-preset-card category-${cat}`}
                  onClick={() => handleChoosePreset(cat)}
                  data-testid={`hp-sig-preset-${cat}`}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>
            <button
              className="sig-choose-secondary"
              onClick={() => { setModalView('ai'); setLlmStep('copy'); }}
              data-testid="hp-sig-choose-ai"
            >
              {'\u2728'} AI Analysis
              <span className="sig-choose-primary-desc">Let an LLM analyze this headphone</span>
            </button>
            <button
              className="sig-choose-link"
              onClick={() => { setModalView('tabs'); setTab('manual'); }}
              data-testid="hp-sig-choose-manual"
            >
              Start from scratch {'\u2192'}
            </button>
          </div>
        ) : modalView === 'ai' ? (
          <div className="sig-ai-view" data-testid="hp-sig-ai">
            {llmStep === 'copy' && (
              <>
                <p className="modal-description">
                  Press the button below to copy the prompt, then paste it into your favorite LLM (ChatGPT, Gemini, Claude, etc.). It will analyze <strong>{headphone.name}</strong>'s sound character — how it colors bass, treble, warmth, and more across all music.
                </p>
                {generateError && (
                  <div className="modal-validation invalid">
                    <span className="modal-validation-icon">{'\u2717'}</span>
                    <span className="modal-validation-text">{generateError}</span>
                  </div>
                )}
                <button
                  className="btn-modal primary sig-ai-copy-btn"
                  onClick={handleCopyAi}
                  data-testid="hp-sig-ai-copy"
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <div className="sig-ai-divider"><span>or</span></div>
                <div className="sig-ai-apikey-section">
                  <span className="sig-ai-apikey-text">Have an API key?</span>
                  <button className="sig-ai-apikey-link" onClick={() => setShowPreferences(true)}>
                    Set up API key
                  </button>
                </div>
                {hasApiKey && (
                  <button
                    className="btn-modal primary"
                    onClick={handleGenerateAi}
                    disabled={generating}
                    data-testid="hp-sig-ai-generate"
                  >
                    {generating ? 'Generating...' : `Generate with ${availableProvider!.name}`}
                  </button>
                )}
              </>
            )}
            {llmStep === 'paste' && (
              <>
                {llmValidation?.valid ? (
                  <>
                    <div className="sig-ai-preview">
                      <div className="sig-ai-preview-bars">
                        {llmValidation.sig.bars.map((bar) => (
                          <div className="sig-ai-preview-bar" key={bar.label}>
                            <span className="sig-ai-preview-bar-label">{bar.label}</span>
                            <span className={`sig-ai-preview-bar-level level-${bar.level}`}>{bar.level.replace('-', ' ')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="sig-ai-preview-tags">
                        {llmValidation.sig.tags.map((tag) => (
                          <span className="tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="sig-ai-recopy">
                      Not what you expected?{' '}
                      <span className="sig-ai-recopy-link" onClick={() => setJsonInput('')}>Paste another response</span>
                    </div>
                    <div className="sig-llm-tag-picker sig-llm-tag-picker-centered">
                      <span className="sig-llm-tag-label">Tag the LLM you copied from</span>
                      {LLM_TAG_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          className={`llm-tag-badge${selectedLlmTag === opt.id ? ' selected' : ''}`}
                          onClick={() => setSelectedLlmTag(opt.id)}
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="modal-description">
                      After pasting the prompt into your favorite LLM (ChatGPT, Gemini, Claude, etc.), copy its response and paste it below.
                    </p>
                    <textarea
                      className="modal-textarea"
                      placeholder='{"tags": [...], "bars": [...]}'
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      rows={8}
                      data-testid="hp-sig-ai-input"
                    />
                    {llmValidation && (
                      <div className="modal-validation invalid">
                        <span className="modal-validation-icon">{'\u2717'}</span>
                        <span className="modal-validation-text">{llmValidation.error}</span>
                      </div>
                    )}
                    <div className="sig-ai-recopy">
                      Lost the prompt?{' '}
                      <span className="sig-ai-recopy-link" onClick={handleRecopy}>
                        {copied ? 'Copied!' : 'Copy again'}
                      </span>
                    </div>
                  </>
                )}
                <div className="modal-actions">
                  <button className="btn-modal secondary" onClick={() => { setJsonInput(''); setLlmStep('copy'); }}>
                    Back
                  </button>
                  <button
                    className="btn-modal primary"
                    onClick={handleApplyLlm}
                    disabled={!llmValidation?.valid || generating}
                    data-testid="hp-sig-ai-save"
                  >
                    Save &amp; Refine &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
        {/* Tab toggle */}
        <div className="hp-sig-tabs" data-testid="hp-sig-tabs">
          <button
            className={`hp-sig-tab${tab === 'manual' ? ' active' : ''}`}
            onClick={() => setTab('manual')}
          >
            Refine
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
            {/* Refining-from hint */}
            {(() => {
              const base = presetPerspective
                ?? latestSig?.perspectives.find(p => p.source === 'llm')
                ?? latestSig?.perspectives.find(p => p.source === 'preset');
              return base ? (
                <div className="sig-refining-from">
                  Refining from <span className="sig-refining-from-label">{base.label}</span>
                </div>
              ) : null;
            })()}
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
              {preset && (
                <button className="btn-modal secondary" onClick={handleResetToPreset} title="Reset bars and tags to preset baseline">
                  Reset to Preset
                </button>
              )}
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
              {hasApiKey
                ? <>Generate a sound profile for <strong>{headphone.name}</strong> — how it colors bass, treble, warmth, and more — using your {availableProvider!.name} API key.</>
                : <>Copy this prompt and paste it into any LLM to analyze <strong>{headphone.name}</strong>'s sound character — bass, treble, warmth, and more.</>
              }
            </p>
            <button className="prompt-toggle" onClick={() => setShowPrompt((v) => !v)}>
              <span className={`prompt-toggle-arrow${showPrompt ? ' open' : ''}`}>{'\u25B6'}</span>
              View prompt
            </button>
            {showPrompt && (
              <textarea className="modal-textarea" readOnly value={prompt} rows={8} />
            )}
            {generateError && (
              <div className="modal-validation invalid">
                <span className="modal-validation-icon">{'\u2717'}</span>
                <span className="modal-validation-text">{generateError}</span>
              </div>
            )}
            <div className="modal-footer" style={{ marginBottom: 'var(--space-4)' }}>
              <span className="api-key-link" onClick={() => setShowPreferences(true)}>
                {hasApiKey ? 'API key settings' : 'Have an API key? Use it instead'}
                <span className="api-key-link-info" aria-label="Skip copy-paste by connecting your own API key">i</span>
              </span>
              <div className="modal-actions">
                {hasApiKey ? (
                  <>
                    <button className="btn-modal secondary" onClick={handleCopy} disabled={generating}>
                      {copied ? 'Copied!' : 'Copy Instead'}
                    </button>
                    <button
                      className="btn-modal primary"
                      onClick={handleGenerate}
                      disabled={generating}
                      data-testid="hp-sig-generate"
                    >
                      {generating ? 'Generating...' : `Generate with ${availableProvider!.name}`}
                    </button>
                  </>
                ) : (
                  <button className="btn-modal primary" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                )}
              </div>
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
            {llmValidation?.valid && (
              <div className="sig-llm-tag-picker">
                <span className="sig-llm-tag-label">Tag the LLM you copied from</span>
                {LLM_TAG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`llm-tag-badge${selectedLlmTag === opt.id ? ' selected' : ''}`}
                    onClick={() => setSelectedLlmTag(opt.id)}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
              {hasApiKey && (
                <button
                  className="btn-modal secondary"
                  onClick={() => { setJsonInput(''); handleGenerate(); }}
                  disabled={generating}
                  data-testid="hp-sig-regenerate"
                >
                  {generating ? 'Generating...' : 'Generate Another'}
                </button>
              )}
              <button
                className="btn-modal primary"
                onClick={handleApplyLlm}
                disabled={!llmValidation?.valid || generating}
                data-testid="hp-sig-apply-llm"
              >
                Save &amp; Refine &rarr;
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
      {showPreferences && <ApiKeyPreferencesModal onClose={() => setShowPreferences(false)} />}
    </div>
  );
}
