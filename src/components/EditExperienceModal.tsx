import { useState, useMemo } from 'react';
import type { Song, SongSignature, Headphone, HeadphoneSignature, ExperienceNote, VoicedExperience, LlmTag } from '../data/types';
import { generateExperiencePrompt } from '../data/experiencePromptTemplate';
import { parseExperienceNoteJSON } from '../data/experienceStorage';
import { VOICES, VOICE_MAP, LLM_TAG_OPTIONS, buildCustomVoicePromptHint } from '../data/voices';
import type { CustomVoice } from '../data/voices';
import { getApiKey } from '../data/preferencesStorage';
import { generateWithApiKey, extractJSON } from '../data/llmApi';
import ApiKeyPreferencesModal from './ApiKeyPreferencesModal';

interface Props {
  song: Song;
  songSignature: SongSignature;
  headphone: Headphone;
  hpSignature: HeadphoneSignature;
  existingNote: ExperienceNote | null;
  onSave: (note: ExperienceNote) => void;
  onClose: () => void;
}

type Step = 'copy' | 'paste';

function resolvePrimary(voices: VoicedExperience[], defaultVoiceId: string): VoicedExperience {
  return voices.find((v) => v.voiceId === defaultVoiceId)!;
}

export default function EditExperienceModal({
  song, songSignature, headphone, hpSignature, existingNote, onSave, onClose,
}: Props) {
  const [step, setStep] = useState<Step>('copy');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [manualTagline, setManualTagline] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Voice state
  const [selectedVoiceId, setSelectedVoiceId] = useState('neutral');
  const [customVoice, setCustomVoice] = useState<CustomVoice>({ name: '', handle: '' });
  const [llmTag, setLlmTag] = useState<LlmTag>('chatgpt');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Default voice tracking
  const [defaultVoiceId, setDefaultVoiceId] = useState<string | undefined>(existingNote?.defaultVoiceId);

  // Existing voices from the note
  const existingVoices: VoicedExperience[] = existingNote?.voices ?? [];
  const hasExistingContent = !!existingNote;
  const isAddingVoice = hasExistingContent;

  // Check if selected voice already exists
  const selectedVoiceExists = existingVoices.some((v) => v.voiceId === selectedVoiceId);

  // All voices available for the checklist (neutral + influencers + custom)
  const allVoices = VOICES;

  const voicePromptHint = useMemo(() => {
    if (selectedVoiceId === 'custom') {
      if (!customVoice.name.trim()) return undefined;
      return buildCustomVoicePromptHint(customVoice, headphone.name);
    }
    const voice = VOICE_MAP[selectedVoiceId];
    return voice?.promptHint || undefined;
  }, [selectedVoiceId, customVoice, headphone.name]);

  const prompt = generateExperiencePrompt(song, songSignature, headphone, hpSignature, voicePromptHint);

  const validation = useMemo<
    { valid: true; note: ExperienceNote } | { valid: false; error: string } | null
  >(() => {
    if (!jsonInput.trim()) return null;
    try {
      const note = parseExperienceNoteJSON(jsonInput);
      const voiceName = selectedVoiceId === 'custom'
        ? customVoice.name.trim() || 'Custom'
        : VOICE_MAP[selectedVoiceId].name;
      return { valid: true, note: { ...note, voiceId: selectedVoiceId, voiceName } };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [jsonInput, selectedVoiceId, customVoice.name]);

  const availableProvider = LLM_TAG_OPTIONS.find(o => o.id !== 'other' && getApiKey(o.id));
  const hasApiKey = !!availableProvider;

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerate() {
    if (!availableProvider) return;
    const apiKey = getApiKey(availableProvider.id);
    if (!apiKey) return;

    setGenerating(true);
    setGenerateError(null);
    setLlmTag(availableProvider.id);

    const result = await generateWithApiKey(availableProvider.id, apiKey, prompt);
    setGenerating(false);

    if (!result.ok) {
      setGenerateError(result.error.message);
      return;
    }

    setJsonInput(extractJSON(result.text));
  }

  function handleApplyLlm() {
    if (!validation?.valid) return;
    const newNote = validation.note;

    if (isAddingVoice && existingNote) {
      const newVoice: VoicedExperience = {
        voiceId: selectedVoiceId,
        voiceName: newNote.voiceName!,
        tagline: newNote.tagline,
        description: newNote.description,
        sections: newNote.sections,
        videoReviewUrl: newNote.videoReviewUrl,
        llmTag,
      };

      const updatedVoices = [...existingVoices];
      const existingIdx = updatedVoices.findIndex((v) => v.voiceId === newVoice.voiceId);
      if (existingIdx >= 0) {
        updatedVoices[existingIdx] = newVoice;
      } else {
        updatedVoices.push(newVoice);
      }

      const primary = resolvePrimary(updatedVoices, defaultVoiceId!);
      onSave({
        tagline: primary.tagline,
        description: primary.description,
        sections: primary.sections,
        source: 'llm',
        voiceId: primary.voiceId,
        voiceName: primary.voiceName,
        videoReviewUrl: primary.videoReviewUrl,
        voices: updatedVoices,
        defaultVoiceId: defaultVoiceId!,
      });
    } else {
      const voice: VoicedExperience = {
        voiceId: selectedVoiceId,
        voiceName: newNote.voiceName!,
        tagline: newNote.tagline,
        description: newNote.description,
        sections: newNote.sections,
        videoReviewUrl: newNote.videoReviewUrl,
        llmTag,
      };
      onSave({
        ...newNote,
        voices: [voice],
        defaultVoiceId: voice.voiceId,
      });
    }
    onClose();
  }

  function handleSaveManual() {
    if (!manualTagline.trim() || !manualDescription.trim()) return;

    if (isAddingVoice && existingNote) {
      const newVoice: VoicedExperience = {
        voiceId: 'manual',
        voiceName: 'Manual',
        tagline: manualTagline.trim(),
        description: manualDescription.trim(),
      };

      const updatedVoices = [...existingVoices];
      const existingIdx = updatedVoices.findIndex((v) => v.voiceId === 'manual');
      if (existingIdx >= 0) {
        updatedVoices[existingIdx] = newVoice;
      } else {
        updatedVoices.push(newVoice);
      }

      const primary = resolvePrimary(updatedVoices, defaultVoiceId!);
      onSave({
        tagline: primary.tagline,
        description: primary.description,
        sections: primary.sections,
        source: primary.voiceId === 'manual' ? 'manual' : 'llm',
        voiceId: primary.voiceId,
        voiceName: primary.voiceName,
        voices: updatedVoices,
        defaultVoiceId: defaultVoiceId!,
      });
    } else {
      const voice: VoicedExperience = {
        voiceId: 'manual',
        voiceName: 'Manual',
        tagline: manualTagline.trim(),
        description: manualDescription.trim(),
      };
      onSave({
        tagline: manualTagline.trim(),
        description: manualDescription.trim(),
        source: 'manual',
        voiceId: 'manual',
        voiceName: 'Manual',
        voices: [voice],
        defaultVoiceId: 'manual',
      });
    }
    onClose();
  }

  function handleDeleteVoice(voiceIdx: number) {
    if (!existingNote || !existingVoices.length) return;
    const updatedVoices = existingVoices.filter((_, i) => i !== voiceIdx);

    if (updatedVoices.length === 0) return;

    // If we deleted the default, reset to first voice
    const newDefault = updatedVoices.some((v) => v.voiceId === defaultVoiceId)
      ? defaultVoiceId!
      : updatedVoices[0].voiceId;
    setDefaultVoiceId(newDefault);

    const primary = resolvePrimary(updatedVoices, newDefault);
    onSave({
      tagline: primary.tagline,
      description: primary.description,
      sections: primary.sections,
      source: primary.voiceId === 'manual' ? 'manual' : 'llm',
      voiceId: primary.voiceId,
      voiceName: primary.voiceName,
      voices: updatedVoices,
      defaultVoiceId: newDefault,
    });
  }

  function handleSetDefault(voiceId: string) {
    if (!existingNote) return;
    setDefaultVoiceId(voiceId);

    // Immediately save with new default
    const voices = existingVoices;
    if (!voices.length) return;

    const primary = resolvePrimary(voices, voiceId);
    onSave({
      tagline: primary.tagline,
      description: primary.description,
      sections: primary.sections,
      source: primary.voiceId === 'manual' ? 'manual' : 'llm',
      voiceId: primary.voiceId,
      voiceName: primary.voiceName,
      videoReviewUrl: primary.videoReviewUrl,
      voices,
      defaultVoiceId: voiceId,
    });
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Button label
  const saveBtnLabel = isAddingVoice
    ? (selectedVoiceExists ? 'Replace Voice' : 'Add Voice')
    : 'Save Experience';

  // Find LLM tag info for a voiced experience
  function getLlmTagIcon(tag?: LlmTag): string | null {
    if (!tag) return null;
    return LLM_TAG_OPTIONS.find((o) => o.id === tag)?.icon ?? null;
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel edit-exp-modal" data-testid="edit-exp-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">{isAddingVoice ? 'Add Voice' : 'Edit Notes'}</h2>
        <p className="modal-subtitle">
          {song.title} on {headphone.name}
        </p>

        {/* Existing voices chips with default star */}
        {existingVoices.length > 0 && (
          <div className="edit-exp-existing-voices" data-testid="edit-exp-existing-voices">
            <label className="voice-label">Existing voices</label>
            <div className="voice-chips voice-chips-edit">
              {existingVoices.map((v, i) => {
                const isDefault = defaultVoiceId === v.voiceId;
                const tagIcon = getLlmTagIcon(v.llmTag);
                return (
                  <span key={v.voiceId + '-' + i} className={`voice-chip existing${isDefault ? ' default' : ''}`}>
                    <button
                      className="voice-default-star"
                      onClick={() => handleSetDefault(v.voiceId)}
                      title={isDefault ? 'Default voice' : `Set ${v.voiceName} as default`}
                      aria-label={isDefault ? 'Default voice' : `Set ${v.voiceName} as default`}
                    >
                      {isDefault ? '\u2605' : '\u2606'}
                    </button>
                    {v.voiceName}
                    {tagIcon && <span className={`llm-tag-micro llm-tag-${v.llmTag}`}>{tagIcon}</span>}
                    {existingVoices.length > 1 && (
                      <button
                        className="voice-chip-delete"
                        onClick={() => handleDeleteVoice(i)}
                        title={`Remove ${v.voiceName} voice`}
                        aria-label={`Remove ${v.voiceName} voice`}
                      >
                        {'\u00D7'}
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab toggle */}
        <div className="hp-sig-tabs">
          <button
            className={`hp-sig-tab${step === 'copy' ? ' active' : ''}`}
            onClick={() => setStep('copy')}
          >
            Use LLM
          </button>
          <button
            className={`hp-sig-tab${step === 'paste' ? ' active' : ''}`}
            onClick={() => setStep('paste')}
          >
            Write Manually
          </button>
        </div>

        {step === 'copy' && (
          <>
            <p className="modal-description">
              {isAddingVoice
                ? <>Add another perspective for how <strong>{song.title}</strong> sounds on <strong>{headphone.name}</strong>.</>
                : <>Copy this prompt and paste it into any LLM to describe how <strong>{song.title}</strong> sounds on <strong>{headphone.name}</strong> — what gets highlighted, what gets lost.</>
              }
            </p>

            {/* Voice Checklist */}
            <div className="voice-selector" data-testid="voice-selector">
              <label className="voice-label">Voice Perspectives</label>
              <div className="voice-checklist" data-testid="voice-checklist">
                {allVoices.map((v) => {
                  const filled = existingVoices.find((ev) => ev.voiceId === v.id);
                  const isSelected = selectedVoiceId === v.id;
                  const tagIcon = filled ? getLlmTagIcon(filled.llmTag) : null;
                  return (
                    <button
                      key={v.id}
                      className={`voice-checklist-item${isSelected ? ' selected' : ''}${filled ? ' filled' : ''}`}
                      onClick={() => setSelectedVoiceId(v.id)}
                      data-testid={`voice-item-${v.id}`}
                    >
                      <span className="voice-check-indicator">{filled ? '\u2713' : '\u25CB'}</span>
                      <span className="voice-checklist-info">
                        <span className="voice-checklist-name">{v.name}</span>
                        {v.handle && <span className="voice-checklist-handle">{v.handle}</span>}
                      </span>
                      {!filled && v.style && v.id !== 'neutral' && (
                        <span className="voice-checklist-style">{v.style}</span>
                      )}
                      {tagIcon && (
                        <span className={`llm-tag-badge llm-tag-${filled!.llmTag}`}>{tagIcon}</span>
                      )}
                    </button>
                  );
                })}
                {/* Custom voice entry */}
                <button
                  className={`voice-checklist-item${selectedVoiceId === 'custom' ? ' selected' : ''}`}
                  onClick={() => setSelectedVoiceId('custom')}
                  data-testid="voice-item-custom"
                >
                  <span className="voice-check-indicator">{'\u25CB'}</span>
                  <span className="voice-checklist-info">
                    <span className="voice-checklist-name">Custom...</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Custom voice inputs */}
            {selectedVoiceId === 'custom' && (
              <div className="voice-custom-fields" data-testid="voice-custom-fields">
                <div className="voice-custom-row">
                  <label className="voice-custom-label">Name</label>
                  <input
                    className="edit-exp-input"
                    type="text"
                    placeholder="e.g. Max Settings"
                    value={customVoice.name}
                    onChange={(e) => setCustomVoice((prev) => ({ ...prev, name: e.target.value }))}
                    data-testid="voice-custom-name"
                  />
                </div>
                <div className="voice-custom-row">
                  <label className="voice-custom-label">YouTube Handle</label>
                  <input
                    className="edit-exp-input"
                    type="text"
                    placeholder="e.g. @MaxSettings"
                    value={customVoice.handle}
                    onChange={(e) => setCustomVoice((prev) => ({ ...prev, handle: e.target.value }))}
                    data-testid="voice-custom-handle"
                  />
                </div>
              </div>
            )}

            {/* LLM Tag Selector */}
            <div className="llm-tag-selector" data-testid="llm-tag-selector">
              <label className="voice-label">Generated with</label>
              <div className="llm-tag-options">
                {LLM_TAG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`llm-tag-option llm-tag-${opt.id}${llmTag === opt.id ? ' active' : ''}`}
                    onClick={() => setLlmTag(opt.id)}
                    data-testid={`llm-tag-${opt.id}`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>

            {songSignature.sections && songSignature.sections.length > 0 ? (
              <div className="edit-exp-context-note valid">
                Song structure included ({songSignature.sections.length} sections)
              </div>
            ) : (
              <div className="edit-exp-context-note missing">
                No song structure available — update the song's sound signature to include sections for richer results
              </div>
            )}
            <button className="prompt-toggle" onClick={() => setShowPrompt((v) => !v)}>
              <span className={`prompt-toggle-arrow${showPrompt ? ' open' : ''}`}>{'\u25B6'}</span>
              View prompt
            </button>
            {showPrompt && (
              <textarea className="modal-textarea" readOnly value={prompt} rows={10} />
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
                      data-testid="edit-exp-generate"
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
              placeholder='{"tagline": "...", "description": "..."}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={6}
              data-testid="edit-exp-llm-input"
            />
            {validation && (
              <div className={`modal-validation ${validation.valid ? 'valid' : 'invalid'}`}>
                <span className="modal-validation-icon">{validation.valid ? '\u2713' : '\u2717'}</span>
                <span className="modal-validation-text">
                  {validation.valid ? 'Valid experience note' : validation.error}
                </span>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
              {hasApiKey && (
                <button
                  className="btn-modal secondary"
                  onClick={() => { setJsonInput(''); handleGenerate(); }}
                  disabled={generating}
                  data-testid="edit-exp-regenerate"
                >
                  {generating ? 'Generating...' : 'Generate Another'}
                </button>
              )}
              <button
                className="btn-modal primary"
                onClick={handleApplyLlm}
                disabled={!validation?.valid || generating}
                data-testid="edit-exp-apply"
              >
                {saveBtnLabel}
              </button>
            </div>
          </>
        )}

        {step === 'paste' && (
          <>
            <p className="modal-description">
              {isAddingVoice
                ? <>Add your own perspective for how <strong>{song.title}</strong> sounds on <strong>{headphone.name}</strong>.</>
                : <>Write your own description of how <strong>{song.title}</strong> sounds on <strong>{headphone.name}</strong>.</>
              }
            </p>
            <div className="edit-exp-manual-fields">
              <label className="edit-exp-field-label">First Impression</label>
              <input
                className="edit-exp-input"
                type="text"
                placeholder='"The close-your-eyes-on-the-train experience"'
                value={manualTagline}
                onChange={(e) => setManualTagline(e.target.value)}
                maxLength={120}
                data-testid="edit-exp-tagline"
              />
              <label className="edit-exp-field-label">Listening Notes</label>
              <textarea
                className="modal-textarea"
                placeholder="Describe the listening experience..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={5}
                data-testid="edit-exp-description"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn-modal primary"
                onClick={handleSaveManual}
                disabled={!manualTagline.trim() || !manualDescription.trim()}
                data-testid="edit-exp-save-manual"
              >
                {isAddingVoice ? 'Add Voice' : 'Save Experience'}
              </button>
            </div>
          </>
        )}
      </div>
      {showPreferences && <ApiKeyPreferencesModal onClose={() => setShowPreferences(false)} />}
    </div>
  );
}
