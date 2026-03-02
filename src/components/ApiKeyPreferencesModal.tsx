import { useState } from 'react';
import { LLM_TAG_OPTIONS } from '../data/voices';
import { loadApiKeys, saveApiKeys } from '../data/preferencesStorage';

interface Props {
  onClose: () => void;
}

const PROVIDERS = LLM_TAG_OPTIONS.filter((o) => o.id !== 'other');

export default function ApiKeyPreferencesModal({ onClose }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>(() => loadApiKeys());
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  function handleChange(id: string, value: string) {
    setKeys((prev) => ({ ...prev, [id]: value }));
  }

  function toggleVisibility(id: string) {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave() {
    // Only store non-empty keys
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(keys)) {
      if (v.trim()) cleaned[k] = v.trim();
    }
    saveApiKeys(cleaned);
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel api-key-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">API Key Preferences</h2>
        <p className="modal-description">
          Enter your API keys to skip the copy-paste step.
        </p>

        {PROVIDERS.map((provider) => (
          <div className="api-key-field" key={provider.id}>
            <label className="api-key-label">
              {provider.name}
              <span className={`llm-tag-badge llm-tag-${provider.id}`}>{provider.icon}</span>
            </label>
            <div className="api-key-input-row">
              <input
                className="edit-exp-input"
                type={visibility[provider.id] ? 'text' : 'password'}
                placeholder={`Enter ${provider.name} API key`}
                value={keys[provider.id] || ''}
                onChange={(e) => handleChange(provider.id, e.target.value)}
                autoComplete="off"
              />
              <button
                className="api-key-toggle"
                onClick={() => toggleVisibility(provider.id)}
                type="button"
              >
                {visibility[provider.id] ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ))}

        <p className="api-key-note">Keys are stored locally on your device.</p>

        <div className="modal-actions">
          <button className="btn-modal secondary" onClick={onClose}>Cancel</button>
          <button className="btn-modal primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
