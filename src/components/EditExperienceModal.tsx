import { useState, useMemo } from 'react';
import type { Song, SongSignature, Headphone, HeadphoneSignature, ExperienceNote } from '../data/types';
import { generateExperiencePrompt } from '../data/experiencePromptTemplate';
import { parseExperienceNoteJSON } from '../data/experienceStorage';

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

export default function EditExperienceModal({
  song, songSignature, headphone, hpSignature, existingNote, onSave, onClose,
}: Props) {
  const [step, setStep] = useState<Step>('copy');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [manualTagline, setManualTagline] = useState(existingNote?.tagline ?? '');
  const [manualDescription, setManualDescription] = useState(existingNote?.description ?? '');

  const prompt = generateExperiencePrompt(song, songSignature, headphone, hpSignature);

  const validation = useMemo<
    { valid: true; note: ExperienceNote } | { valid: false; error: string } | null
  >(() => {
    if (!jsonInput.trim()) return null;
    try {
      const note = parseExperienceNoteJSON(jsonInput);
      return { valid: true, note };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [jsonInput]);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleApplyLlm() {
    if (validation?.valid) {
      onSave(validation.note);
      onClose();
    }
  }

  function handleSaveManual() {
    if (manualTagline.trim() && manualDescription.trim()) {
      onSave({
        tagline: manualTagline.trim(),
        description: manualDescription.trim(),
        source: 'manual',
      });
      onClose();
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel edit-exp-modal" data-testid="edit-exp-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">Edit Experience</h2>
        <p className="modal-subtitle">
          {song.title} on {headphone.name}
        </p>

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
              Copy this prompt and paste it into any LLM to describe how <strong>{song.title}</strong> sounds on <strong>{headphone.name}</strong>.
            </p>
            {songSignature.sections && songSignature.sections.length > 0 ? (
              <div className="edit-exp-context-note valid">
                Song structure included ({songSignature.sections.length} sections)
              </div>
            ) : (
              <div className="edit-exp-context-note missing">
                No song structure available — update the song's sound signature to include sections for richer results
              </div>
            )}
            <textarea className="modal-textarea" readOnly value={prompt} rows={10} />
            <div className="modal-actions" style={{ marginBottom: 'var(--space-4)' }}>
              <button className="btn-modal primary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
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
              <button
                className="btn-modal primary"
                onClick={handleApplyLlm}
                disabled={!validation?.valid}
                data-testid="edit-exp-apply"
              >
                Save Experience
              </button>
            </div>
          </>
        )}

        {step === 'paste' && (
          <>
            <p className="modal-description">
              Write your own description of how <strong>{song.title}</strong> sounds on <strong>{headphone.name}</strong>.
            </p>
            <div className="edit-exp-manual-fields">
              <label className="edit-exp-field-label">Tagline</label>
              <input
                className="edit-exp-input"
                type="text"
                placeholder='"The close-your-eyes-on-the-train experience"'
                value={manualTagline}
                onChange={(e) => setManualTagline(e.target.value)}
                maxLength={120}
                data-testid="edit-exp-tagline"
              />
              <label className="edit-exp-field-label">Description</label>
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
                Save Experience
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
