import { useState } from 'react';
import type { SongSignature, SignaturePerspective } from '../data/types';
import { LLM_TAG_OPTIONS } from '../data/voices';
import StrengthBars from './StrengthBars';

interface Props {
  signature: SongSignature;
  onEdit: () => void;
  onSave: (sig: SongSignature) => void;
}

const MAX_VISIBLE_CHIPS = 3;

export default function SongSignatureDisplay({ signature, onEdit, onSave }: Props) {
  const { perspectives, defaultPerspectiveId } = signature;
  const hasPerspectives = perspectives.length > 1;

  // Local preview state — which perspective is being viewed (may differ from default)
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);

  const activeId = previewId ?? defaultPerspectiveId;
  const activePerspective = perspectives.find(p => p.perspectiveId === activeId) ?? perspectives[0];

  const displayTags = activePerspective.tags;
  const displayBars = activePerspective.bars;
  const displaySections = activePerspective.sections;

  function handleStar(perspectiveId: string) {
    const perspective = perspectives.find(p => p.perspectiveId === perspectiveId);
    if (!perspective) return;

    const updated: SongSignature = {
      tags: perspective.tags,
      bars: perspective.bars,
      ...(perspective.sections ? { sections: perspective.sections } : {}),
      perspectives: signature.perspectives,
      defaultPerspectiveId: perspectiveId,
    };
    onSave(updated);
    setPreviewId(null);
  }

  function getLlmIcon(p: SignaturePerspective): string | null {
    if (!p.llmTag) return null;
    const opt = LLM_TAG_OPTIONS.find(o => o.id === p.llmTag);
    return opt?.icon ?? null;
  }

  const visibleChips = showOverflow ? perspectives : perspectives.slice(0, MAX_VISIBLE_CHIPS);
  const overflowCount = perspectives.length - MAX_VISIBLE_CHIPS;

  return (
    <div className="signature-card">
      <div className="signature-header">
        <span className="section-header">Sound Signature</span>
        <button
          className="sig-edit-btn"
          onClick={onEdit}
          title="Edit sound signature"
          aria-label="Edit sound signature"
          data-testid="song-sig-edit"
        >
          {'\u270E'}
        </button>
      </div>
      {hasPerspectives && (
        <div className="perspective-chips" data-testid="song-perspective-chips">
          {visibleChips.map((p) => {
            const isActive = p.perspectiveId === activeId;
            const isDefault = p.perspectiveId === defaultPerspectiveId;
            const llmIcon = getLlmIcon(p);
            return (
              <button
                key={p.perspectiveId}
                className={`perspective-chip${isActive ? ' active' : ''}${isDefault ? ' default' : ''}`}
                onClick={() => setPreviewId(p.perspectiveId)}
                data-testid={`perspective-chip-${p.perspectiveId}`}
              >
                <span
                  className="perspective-star"
                  onClick={(e) => { e.stopPropagation(); handleStar(p.perspectiveId); }}
                  title={isDefault ? 'Default perspective' : 'Set as default'}
                >
                  {isDefault ? '\u2605' : '\u2606'}
                </span>
                {p.label}
                {llmIcon && <span className={`llm-tag-micro llm-tag-${p.llmTag}`}>{llmIcon}</span>}
              </button>
            );
          })}
          {!showOverflow && overflowCount > 0 && (
            <button
              className="perspective-chip perspective-overflow"
              onClick={() => setShowOverflow(true)}
            >
              +{overflowCount}
            </button>
          )}
        </div>
      )}
      <div className="signature-tags">
        {displayTags.map((tag) => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </div>
      {displaySections && displaySections.length > 0 && (
        <div className="signature-sections">
          {displaySections.map((s, i) => (
            <div className="signature-section" key={i}>
              <span className="sig-section-time">{s.time}</span>
              <span className="sig-section-label">{s.label}</span>
              <span className="sig-section-desc">{s.description}</span>
            </div>
          ))}
        </div>
      )}
      <StrengthBars bars={displayBars} />
    </div>
  );
}
