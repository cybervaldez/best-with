import { useState, useMemo, useRef, useEffect } from 'react';
import type { Song, SongSignature, SongSection, StrengthBar, BarLevel, SignaturePerspective, LlmTag } from '../data/types';
import { BAR_LABELS } from '../data/categoryDefaults';
import { generateSignaturePrompt } from '../data/promptTemplate';
import { parseSongSignatureJSON } from '../data/songSignatureStorage';
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
  song: Song;
  existingSignature?: SongSignature | null;
  onSave: (signature: SongSignature) => void;
  onClose: () => void;
}

type ModalView = 'choose' | 'ai' | 'tabs';
type Tab = 'refine' | 'llm';
type LlmStep = 'copy' | 'paste';

function defaultBars(): Record<string, number> {
  const bars: Record<string, number> = {};
  for (const label of BAR_LABELS) bars[label] = 3;
  return bars;
}

function barsFromStrength(strengthBars: StrengthBar[]): Record<string, number> {
  const bars: Record<string, number> = {};
  for (const bar of strengthBars) {
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

export default function SongSignatureModal({ song, existingSignature, onSave, onClose }: Props) {
  const llmPerspective = existingSignature?.perspectives.find(p => p.source === 'llm') ?? null;
  const manualPerspective = existingSignature?.perspectives.find(p => p.source === 'manual') ?? null;

  const [modalView, setModalView] = useState<ModalView>(existingSignature ? 'tabs' : 'choose');
  const [tab, setTab] = useState<Tab>(llmPerspective ? 'refine' : 'llm');

  // Refine tab — pre-fill from manual perspective, then LLM, then defaults
  const prefillSource = manualPerspective ?? llmPerspective;
  const [bars, setBars] = useState<Record<string, number>>(() =>
    prefillSource ? barsFromStrength(prefillSource.bars) : defaultBars()
  );
  const [tags, setTags] = useState<string[]>(() => prefillSource?.tags ?? []);
  const [sections, setSections] = useState<SongSection[]>(() => prefillSource?.sections ?? []);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // LLM tab state
  const [llmStep, setLlmStep] = useState<LlmStep>('copy');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedLlmTag, setSelectedLlmTag] = useState<LlmTag>('other');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Track latest saved signature locally (for perspective merging after LLM save)
  const [latestSig, setLatestSig] = useState<SongSignature | null>(existingSignature ?? null);

  // Drag state
  const dragRef = useRef<{ barLabel: string; trackEl: HTMLElement } | null>(null);
  const barsRef = useRef(bars);
  barsRef.current = bars;

  const prompt = generateSignaturePrompt(song);
  const strengthBars = useMemo(() => barsToStrengthBars(bars), [bars]);

  const validation = useMemo<{ valid: true; sig: SongSignature } | { valid: false; error: string } | null>(() => {
    if (!jsonInput.trim()) return null;
    try {
      const sig = parseSongSignatureJSON(jsonInput);
      return { valid: true, sig };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [jsonInput]);

  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

  // Drag listeners
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = drag.trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const level = positionToLevel(pct);
      if (level !== barsRef.current[drag.barLabel]) {
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

  function handleTrackMouseDown(label: string, e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const trackEl = e.currentTarget;
    const rect = trackEl.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setBars((prev) => ({ ...prev, [label]: positionToLevel(pct) }));
    dragRef.current = { barLabel: label, trackEl };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function handleAddTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
    setTagInput('');
    setShowTagInput(false);
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
    if (e.key === 'Escape') { setTagInput(''); setShowTagInput(false); }
  }

  function handleTagBlur() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
    setTagInput('');
    setShowTagInput(false);
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  // Section handlers
  function handleAddSection() {
    setSections((prev) => [...prev, { time: '', label: '', description: '' }]);
  }

  function handleSectionChange(index: number, field: keyof SongSection, value: string) {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function handleRemoveSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  // LLM handlers
  // Check if user has an API key for a non-'other' provider
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
    setTimeout(() => {
      setCopied(false);
      setLlmStep('paste');
    }, 600);
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
    setLlmStep('paste');
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

  function handleSaveLlm() {
    if (!validation?.valid) return;
    const sig = validation.sig;

    // Tag the LLM perspective — label "Breakdown" per audiophile convention
    if (sig.perspectives && sig.perspectives.length > 0) {
      sig.perspectives[0].llmTag = selectedLlmTag;
      sig.perspectives[0].label = 'Breakdown';
    }

    // Merge: keep existing manual perspectives, replace LLM
    const existingManual = latestSig?.perspectives.filter(p => p.source === 'manual') ?? [];
    const newPerspectives = [...sig.perspectives, ...existingManual];

    const merged: SongSignature = {
      ...sig,
      perspectives: newPerspectives,
      defaultPerspectiveId: sig.perspectives[0].perspectiveId,
    };

    onSave(merged);
    setLatestSig(merged);
    // Pre-fill refine tab with LLM data
    setBars(barsFromStrength(sig.bars));
    setTags(sig.tags);
    setSections(sig.sections ?? []);
    setModalView('tabs');
    setTab('refine');
  }

  function handleSaveRefine() {
    const manualBars = strengthBars;
    const filteredSections = sections.filter(s => s.time.trim() || s.label.trim() || s.description.trim());

    // Determine base for refinedFrom
    const llmBase = latestSig?.perspectives.find(p => p.source === 'llm') ?? null;

    const newManual: SignaturePerspective = {
      perspectiveId: manualPerspective?.perspectiveId ?? 'manual-' + Date.now(),
      label: 'My Take',
      tags,
      bars: manualBars,
      ...(filteredSections.length > 0 ? { sections: filteredSections } : {}),
      source: 'manual',
      ...(llmBase ? { refinedFrom: llmBase.perspectiveId } : {}),
    };

    // Keep existing LLM perspectives
    const existingLlm = latestSig?.perspectives.filter(p => p.source === 'llm') ?? [];
    const allPerspectives = [...existingLlm, newManual];

    const defaultId = latestSig?.defaultPerspectiveId ?? newManual.perspectiveId;
    const defaultPerspective = allPerspectives.find(p => p.perspectiveId === defaultId) ?? newManual;

    const result: SongSignature = {
      tags: defaultPerspective.tags,
      bars: defaultPerspective.bars,
      ...(defaultPerspective.sections ? { sections: defaultPerspective.sections } : {}),
      perspectives: allPerspectives,
      defaultPerspectiveId: defaultId,
    };

    onSave(result);
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel hp-sig-modal" data-testid="song-sig-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">{song.title}</h2>
        <p className="modal-subtitle">{song.artist} &mdash; {song.album}</p>

        {modalView === 'choose' ? (
          <div className="sig-choose-screen" data-testid="song-sig-choose">
            <p className="sig-choose-subtitle">How do you want to start?</p>
            <button
              className="sig-choose-primary"
              onClick={() => { setModalView('ai'); setLlmStep('copy'); }}
              data-testid="song-sig-choose-ai"
            >
              {'\u2728'} AI Analysis
              <span className="sig-choose-primary-desc">Let an LLM analyze this track</span>
            </button>
            <button
              className="sig-choose-link"
              onClick={() => { setModalView('tabs'); setTab('refine'); }}
              data-testid="song-sig-choose-manual"
            >
              I'll rate this myself {'\u2192'}
            </button>
          </div>
        ) : modalView === 'ai' ? (
          <div className="sig-ai-view" data-testid="song-sig-ai">
            {llmStep === 'copy' && (
              <>
                <p className="modal-description">
                  Press the button below to copy the prompt, then paste it into your favorite LLM (ChatGPT, Gemini, Claude, etc.). It will analyze <strong>{song.title}</strong>'s sound profile — bass, treble, warmth, soundstage, and more.
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
                  data-testid="song-sig-ai-copy"
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
                    data-testid="song-sig-ai-generate"
                  >
                    {generating ? 'Generating...' : `Generate with ${availableProvider!.name}`}
                  </button>
                )}
              </>
            )}
            {llmStep === 'paste' && (
              <>
                {validation?.valid ? (
                  <>
                    <div className="sig-ai-preview">
                      <div className="sig-ai-preview-bars">
                        {validation.sig.bars.map((bar) => (
                          <div className="sig-ai-preview-bar" key={bar.label}>
                            <span className="sig-ai-preview-bar-label">{bar.label}</span>
                            <span className={`sig-ai-preview-bar-level level-${bar.level}`}>{bar.level.replace('-', ' ')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="sig-ai-preview-tags">
                        {validation.sig.tags.map((tag) => (
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
                      data-testid="song-sig-ai-input"
                    />
                    {validation && (
                      <div className="modal-validation invalid">
                        <span className="modal-validation-icon">{'\u2717'}</span>
                        <span className="modal-validation-text">{validation.error}</span>
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
                    onClick={handleSaveLlm}
                    disabled={!validation?.valid || generating}
                    data-testid="song-sig-ai-save"
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
        <div className="hp-sig-tabs" data-testid="song-sig-tabs">
          <button
            className={`hp-sig-tab${tab === 'refine' ? ' active' : ''}`}
            onClick={() => setTab('refine')}
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

        {tab === 'refine' && (
          <div className="hp-sig-manual" data-testid="song-sig-refine">
            {/* Refining-from hint */}
            {(() => {
              const base = latestSig?.perspectives.find(p => p.source === 'llm');
              return base ? (
                <div className="sig-refining-from">
                  Refining from <span className="sig-refining-from-label">{base.label}</span>
                </div>
              ) : null;
            })()}
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
                        data-testid={`song-bar-${label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {TICK_POSITIONS.map((pos, i) => (
                          <div key={i} className="range-tick" style={{ left: `${pos}%` }} />
                        ))}
                        <div
                          className="hp-bar-marker"
                          style={{ left: `${levelToPosition(level)}%` }}
                        />
                      </div>
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

            {/* Tags inline */}
            <div className="hp-sig-category-preview">
              <span className="hp-sig-category-label">Tags:</span>
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
                    data-testid="song-sig-tag-input"
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

            {/* Section editor */}
            <div className="sig-sections-editor">
              <div className="sig-sections-header">
                <span className="hp-sig-category-label">Sections</span>
                <button className="sig-section-add" onClick={handleAddSection} title="Add section">+</button>
              </div>
              {sections.map((section, i) => (
                <div className="sig-section-row" key={i}>
                  <input
                    className="sig-section-input sig-section-time"
                    type="text"
                    placeholder="0:00–0:32"
                    value={section.time}
                    onChange={(e) => handleSectionChange(i, 'time', e.target.value)}
                  />
                  <input
                    className="sig-section-input sig-section-label"
                    type="text"
                    placeholder="Intro"
                    value={section.label}
                    onChange={(e) => handleSectionChange(i, 'label', e.target.value)}
                  />
                  <input
                    className="sig-section-input sig-section-desc"
                    type="text"
                    placeholder="Description..."
                    value={section.description}
                    onChange={(e) => handleSectionChange(i, 'description', e.target.value)}
                  />
                  <button className="sig-section-remove" onClick={() => handleRemoveSection(i)}>&times;</button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
              <button className="btn-modal primary" onClick={handleSaveRefine} data-testid="song-sig-save-refine">
                {existingSignature ? 'Update Signature' : 'Save Signature'}
              </button>
            </div>
          </div>
        )}

        {tab === 'llm' && (
          <div className="hp-sig-llm" data-testid="song-sig-llm">
            {llmStep === 'copy' && (
              <>
                <p className="modal-description">
                  {hasApiKey
                    ? <>Generate a sound profile for <strong>{song.title}</strong> — bass, treble, warmth, soundstage, and more — using your {availableProvider!.name} API key.</>
                    : <>Copy this prompt and paste it into any LLM to get a sound profile of <strong>{song.title}</strong> — bass, treble, warmth, soundstage, and more.</>
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
                <div className="modal-footer">
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
                          data-testid="song-sig-generate"
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
              </>
            )}

            {llmStep === 'paste' && (
              <>
                <p className="modal-description">Paste the JSON response below:</p>
                <textarea
                  className="modal-textarea"
                  placeholder='{"tags": [...], "bars": [...]}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={8}
                  data-testid="song-sig-llm-input"
                />
                {validation && (
                  <div className={`modal-validation ${validation.valid ? 'valid' : 'invalid'}`}>
                    <span className="modal-validation-icon">{validation.valid ? '\u2713' : '\u2717'}</span>
                    <span className="modal-validation-text">
                      {validation.valid ? 'Valid signature' : validation.error}
                    </span>
                  </div>
                )}
                {validation?.valid && (
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
                  <button className="btn-modal secondary" onClick={() => setLlmStep('copy')}>
                    Back
                  </button>
                  {hasApiKey && (
                    <button
                      className="btn-modal secondary"
                      onClick={() => { setJsonInput(''); handleGenerate(); }}
                      disabled={generating}
                      data-testid="song-sig-regenerate"
                    >
                      {generating ? 'Generating...' : 'Generate Another'}
                    </button>
                  )}
                  <button
                    className="btn-modal primary"
                    onClick={handleSaveLlm}
                    disabled={!validation?.valid || generating}
                    data-testid="song-sig-save-llm"
                  >
                    Save &amp; Refine &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        )}
          </>
        )}
      </div>
      {showPreferences && <ApiKeyPreferencesModal onClose={() => setShowPreferences(false)} />}
    </div>
  );
}
