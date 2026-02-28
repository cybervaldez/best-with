import { useState, useMemo } from 'react';
import type { Song, SongSignature } from '../data/types';
import { generateSignaturePrompt } from '../data/promptTemplate';
import { parseSongSignatureJSON } from '../data/songSignatureStorage';

interface Props {
  song: Song;
  existingSignature?: SongSignature | null;
  onSave: (signature: SongSignature) => void;
  onClose: () => void;
}

type Step = 'copy' | 'paste' | 'success';

export default function SongSignatureModal({ song, existingSignature, onSave, onClose }: Props) {
  const isUpdate = !!existingSignature;
  const [step, setStep] = useState<Step>('copy');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [savedSignature, setSavedSignature] = useState<SongSignature | null>(null);

  const prompt = generateSignaturePrompt(song);

  // Instant validation on every input change
  const validation = useMemo<{ valid: true; sig: SongSignature } | { valid: false; error: string } | null>(() => {
    if (!jsonInput.trim()) return null;
    try {
      const sig = parseSongSignatureJSON(jsonInput);
      return { valid: true, sig };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [jsonInput]);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    if (validation?.valid) {
      setSavedSignature(validation.sig);
      onSave(validation.sig);
      setStep('success');
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        {step === 'copy' && (
          <>
            <h2 className="modal-title">{isUpdate ? 'Update Sound Signature' : 'Get Sound Signature'}</h2>
            <p className="modal-description">
              Copy this prompt and paste it into any LLM (ChatGPT, Claude, etc.)
            </p>
            <textarea
              className="modal-textarea"
              readOnly
              value={prompt}
              rows={12}
            />
            <div className="modal-actions">
              <button className="btn-modal primary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button className="btn-modal secondary" onClick={() => setStep('paste')}>
                Next: Paste Result
              </button>
            </div>
          </>
        )}

        {step === 'paste' && (
          <>
            <h2 className="modal-title">Paste LLM Response</h2>
            <p className="modal-description">
              Paste the JSON response from the LLM below
            </p>
            <textarea
              className="modal-textarea"
              placeholder='{"tags": [...], "bars": [...]}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={12}
            />
            <div className="modal-footer">
              {validation && (
                <div className={`modal-validation ${validation.valid ? 'valid' : 'invalid'}`}>
                  <span className="modal-validation-icon">{validation.valid ? '\u2713' : '\u2717'}</span>
                  <span className="modal-validation-text">
                    {validation.valid ? 'Valid signature' : validation.error}
                  </span>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn-modal secondary" onClick={() => setStep('copy')}>
                  Back
                </button>
                <button
                  className="btn-modal primary"
                  onClick={handleSave}
                  disabled={!validation?.valid}
                >
                  {isUpdate ? 'Update Signature' : 'Save Sound Signature'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && savedSignature && (
          <>
            <h2 className="modal-title">{isUpdate ? 'Signature Updated' : 'Signature Saved'}</h2>
            <div className="modal-preview-tags">
              {savedSignature.tags.map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
            </div>
            <div className="modal-preview-bars">
              {savedSignature.bars.map((bar) => (
                <div className="modal-bar-preview" key={bar.label}>
                  <span className="modal-bar-label">{bar.label}</span>
                  <span className="modal-bar-level">{bar.level}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-modal primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
