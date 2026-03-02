import { useState, useEffect } from 'react';
import type { Headphone, HeadphoneSignature, SongSignature, ExperienceNote, VoicedExperience, LlmTag, SignaturePerspective } from '../data/types';
import { LLM_TAG_OPTIONS } from '../data/voices';
import StrengthBars from './StrengthBars';

interface Props {
  headphone: Headphone;
  hpSignature: HeadphoneSignature;
  songSignature: SongSignature;
  storedNote: ExperienceNote | null;
  onEdit: () => void;
  onSaveHpSignature: (sig: HeadphoneSignature) => void;
}

function getLlmTagInfo(tag?: LlmTag) {
  if (!tag) return null;
  return LLM_TAG_OPTIONS.find((o) => o.id === tag) ?? null;
}

function getLlmIcon(p: SignaturePerspective): string | null {
  if (!p.llmTag) return null;
  const opt = LLM_TAG_OPTIONS.find(o => o.id === p.llmTag);
  return opt?.icon ?? null;
}

const MAX_VISIBLE_CHIPS = 3;

export default function ExperienceCard({
  headphone, hpSignature, storedNote, onEdit, onSaveHpSignature,
}: Props) {
  const defaultIdx = storedNote?.voices
    ? storedNote.voices.findIndex((v) => v.voiceId === storedNote.defaultVoiceId)
    : 0;

  const [activeVoiceIdx, setActiveVoiceIdx] = useState(defaultIdx);

  // HP perspective state
  const hpPerspectives = hpSignature.perspectives;
  const hasHpPerspectives = hpPerspectives.length > 1;
  const hpDefaultId = hpSignature.defaultPerspectiveId;
  const [hpPreviewId, setHpPreviewId] = useState<string | null>(null);
  const [hpHoverId, setHpHoverId] = useState<string | null>(null);
  const [showHpOverflow, setShowHpOverflow] = useState(false);

  const activeHpId = hpPreviewId ?? hpDefaultId;
  // Hover temporarily previews a perspective; click commits it
  const displayHpId = hpHoverId ?? activeHpId;
  const displayHpPerspective = hpPerspectives.find(p => p.perspectiveId === displayHpId) ?? hpPerspectives[0];
  const displayBars = displayHpPerspective.bars;

  // Reset when defaultVoiceId changes (e.g. user toggled default in edit modal)
  useEffect(() => {
    setActiveVoiceIdx(defaultIdx);
  }, [defaultIdx]);

  // Resolve which content to display
  const hasMultipleVoices = storedNote?.voices && storedNote.voices.length > 1;
  let displayTagline = storedNote?.tagline ?? '';
  let displayDescription = storedNote?.description ?? '';
  let displaySections = storedNote?.sections;
  let displayVoiceName = storedNote?.voiceName;
  let displaySource = storedNote?.source;
  let displayVideoUrl = storedNote?.videoReviewUrl;
  let displayLlmTag: LlmTag | undefined;

  if (hasMultipleVoices) {
    const idx = Math.min(activeVoiceIdx, storedNote!.voices!.length - 1);
    const active = storedNote!.voices![idx];
    displayTagline = active.tagline;
    displayDescription = active.description;
    displaySections = active.sections;
    displayVoiceName = active.voiceName;
    displayVideoUrl = active.videoReviewUrl;
    displayLlmTag = active.llmTag;
  } else if (storedNote?.voices?.[0]) {
    displayLlmTag = storedNote.voices[0].llmTag;
  }

  const llmTagInfo = getLlmTagInfo(displayLlmTag);

  // Resolve "based on" label from perspective IDs stamped on the note
  let basedOnLabel: string | null = null;
  if (storedNote?.songPerspectiveId) {
    // Find the song perspective label — but we don't have songSignature perspectives here easily
    // Use hpPerspectiveId instead since it's on this card
  }
  if (storedNote?.hpPerspectiveId) {
    const basedOnP = hpPerspectives.find(p => p.perspectiveId === storedNote.hpPerspectiveId);
    if (basedOnP) basedOnLabel = basedOnP.label;
  }

  function handleStarHp(perspectiveId: string) {
    const perspective = hpPerspectives.find(p => p.perspectiveId === perspectiveId);
    if (!perspective) return;

    const updated: HeadphoneSignature = {
      tags: perspective.tags,
      bars: perspective.bars,
      category: perspective.category ?? hpSignature.category,
      secondaryCategories: perspective.secondaryCategories ?? hpSignature.secondaryCategories,
      perspectives: hpSignature.perspectives,
      defaultPerspectiveId: perspectiveId,
    };
    onSaveHpSignature(updated);
    setHpPreviewId(null);
  }

  const visibleHpChips = showHpOverflow ? hpPerspectives : hpPerspectives.slice(0, MAX_VISIBLE_CHIPS);
  const hpOverflowCount = hpPerspectives.length - MAX_VISIBLE_CHIPS;

  // Show diff overlay only on hover — once clicked, bars display without overlay
  const baseBarsForOverlay = (() => {
    if (!hpHoverId) return undefined;
    // If hovered perspective has refinedFrom, use that
    if (displayHpPerspective.refinedFrom) {
      return hpPerspectives.find(p => p.perspectiveId === displayHpPerspective.refinedFrom)?.bars;
    }
    // Fallback: if hovered perspective is manual, diff against LLM or preset base
    if (displayHpPerspective.source === 'manual') {
      const base = hpPerspectives.find(p => p.source === 'llm')
        ?? hpPerspectives.find(p => p.source === 'preset');
      return base?.bars;
    }
    return undefined;
  })();

  return (
    <div
      className="experience-card"
      data-testid={`experience-card-${headphone.id}`}
    >
      <div className="hp-header">
        <div className="hp-name-row">
          <span className={`hp-dot ${headphone.dotColor}`} />
          <span className="hp-name">{headphone.name}</span>
        </div>
        <div className="hp-header-right">
          <button
            className="exp-edit-btn"
            onClick={onEdit}
            title="Edit experience description"
            aria-label={`Edit experience for ${headphone.name}`}
            data-testid={`exp-edit-${headphone.id}`}
          >
            {'\u270E'}
          </button>
        </div>
      </div>
      {storedNote ? (
        <>
          {/* Voice chips — shown when multiple voices exist */}
          {hasMultipleVoices && (
            <div className="voice-chips" data-testid={`voice-chips-${headphone.id}`}>
              {storedNote!.voices!.map((v: VoicedExperience, i: number) => {
                const isDefault = storedNote!.defaultVoiceId === v.voiceId;
                const tagInfo = getLlmTagInfo(v.llmTag);
                return (
                  <button
                    key={v.voiceId + '-' + i}
                    className={`voice-chip${i === Math.min(activeVoiceIdx, storedNote!.voices!.length - 1) ? ' active' : ''}${isDefault ? ' default' : ''}`}
                    onClick={() => setActiveVoiceIdx(i)}
                    data-testid={`voice-chip-${v.voiceId}`}
                  >
                    {isDefault && <span className="voice-default-indicator">{'\u2605'}</span>}
                    {v.voiceName}
                    {tagInfo && <span className={`llm-tag-micro llm-tag-${v.llmTag}`}>{tagInfo.icon}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {displaySource === 'llm' && displayVoiceName && displayVoiceName !== 'Neutral' && (
            <div className="exp-ai-notice">
              AI-generated in {displayVoiceName}'s style — not their actual words
            </div>
          )}
          <div className="hp-tagline">{'\u201C'}{displayTagline}{'\u201D'}</div>
          <div className="hp-description">{displayDescription}</div>
          {displaySections && displaySections.length > 0 && (
            <div className="exp-sections">
              {displaySections.map((s, i) => (
                <div className="exp-section" key={i}>
                  <span className="exp-section-time">{s.time}</span>
                  <span className="exp-section-label">{s.label}</span>
                  <span className="exp-section-desc">{s.description}</span>
                </div>
              ))}
            </div>
          )}
          {/* HP perspective chips */}
          {hasHpPerspectives && (
            <div className="perspective-chips perspective-chips-compact" data-testid={`hp-perspective-chips-${headphone.id}`}>
              {visibleHpChips.map((p) => {
                const isActive = p.perspectiveId === activeHpId;
                const isDefault = p.perspectiveId === hpDefaultId;
                const icon = getLlmIcon(p);
                return (
                  <button
                    key={p.perspectiveId}
                    className={`perspective-chip${isActive ? ' active' : ''}${isDefault ? ' default' : ''}`}
                    onClick={() => { setHpPreviewId(p.perspectiveId); setHpHoverId(null); }}
                    onMouseEnter={() => setHpHoverId(p.perspectiveId)}
                    onMouseLeave={() => setHpHoverId(null)}
                  >
                    <span
                      className="perspective-star"
                      onClick={(e) => { e.stopPropagation(); handleStarHp(p.perspectiveId); }}
                      title={isDefault ? 'Default perspective' : 'Set as default'}
                    >
                      {isDefault ? '\u2605' : '\u2606'}
                    </span>
                    {p.label}
                    {icon && <span className={`llm-tag-micro llm-tag-${p.llmTag}`}>{icon}</span>}
                  </button>
                );
              })}
              {!showHpOverflow && hpOverflowCount > 0 && (
                <button
                  className="perspective-chip perspective-overflow"
                  onClick={() => setShowHpOverflow(true)}
                >
                  +{hpOverflowCount}
                </button>
              )}
            </div>
          )}
          <StrengthBars bars={displayBars} baseBars={baseBarsForOverlay} />
          <div className="exp-card-footer" data-testid={`exp-source-${headphone.id}`}>
            <span className={`exp-source-badge ${displaySource === 'llm' ? 'ai' : 'manual'}`}>
              {displaySource === 'llm' && <span className="exp-ai-sparkle">{'\u2728'}</span>}
              {displaySource === 'llm' ? 'AI' : 'Custom'}
            </span>
            {llmTagInfo && (
              <span className={`llm-tag-badge llm-tag-${displayLlmTag}`}>{llmTagInfo.icon}</span>
            )}
            {displayVoiceName && displayVoiceName !== 'Neutral' && !hasMultipleVoices && (
              <span className="exp-voice-tag">{displayVoiceName}</span>
            )}
            {basedOnLabel && (
              <span className="exp-based-on">based on: {basedOnLabel}</span>
            )}
            {displayVideoUrl && (
              <a
                className="exp-video-link"
                href={displayVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch video review"
                aria-label="Watch video review on YouTube"
                data-testid={`exp-video-${headphone.id}`}
              >
                <svg className="exp-yt-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.4-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
                </svg>
              </a>
            )}
          </div>
        </>
      ) : (
        <>
          {/* HP perspective chips even without notes */}
          {hasHpPerspectives && (
            <div className="perspective-chips perspective-chips-compact" data-testid={`hp-perspective-chips-${headphone.id}`}>
              {visibleHpChips.map((p) => {
                const isActive = p.perspectiveId === activeHpId;
                const isDefault = p.perspectiveId === hpDefaultId;
                const icon = getLlmIcon(p);
                return (
                  <button
                    key={p.perspectiveId}
                    className={`perspective-chip${isActive ? ' active' : ''}${isDefault ? ' default' : ''}`}
                    onClick={() => { setHpPreviewId(p.perspectiveId); setHpHoverId(null); }}
                    onMouseEnter={() => setHpHoverId(p.perspectiveId)}
                    onMouseLeave={() => setHpHoverId(null)}
                  >
                    <span
                      className="perspective-star"
                      onClick={(e) => { e.stopPropagation(); handleStarHp(p.perspectiveId); }}
                      title={isDefault ? 'Default perspective' : 'Set as default'}
                    >
                      {isDefault ? '\u2605' : '\u2606'}
                    </span>
                    {p.label}
                    {icon && <span className={`llm-tag-micro llm-tag-${p.llmTag}`}>{icon}</span>}
                  </button>
                );
              })}
              {!showHpOverflow && hpOverflowCount > 0 && (
                <button
                  className="perspective-chip perspective-overflow"
                  onClick={() => setShowHpOverflow(true)}
                >
                  +{hpOverflowCount}
                </button>
              )}
            </div>
          )}
          <StrengthBars bars={displayBars} baseBars={baseBarsForOverlay} />
          <div className="exp-needs-edit" onClick={onEdit}>
            Edit experience to describe how this song sounds on {headphone.name}
          </div>
        </>
      )}
    </div>
  );
}

interface NeedsSigProps {
  headphone: Headphone;
  onSetSignature: () => void;
}

export function ExperienceCardNeedsSig({ headphone, onSetSignature }: NeedsSigProps) {
  return (
    <div
      className="experience-card exp-card-needs-sig"
      data-testid={`experience-card-${headphone.id}`}
    >
      <div className="hp-header">
        <div className="hp-name-row">
          <span className={`hp-dot ${headphone.dotColor}`} />
          <span className="hp-name">{headphone.name}</span>
        </div>
      </div>
      <div className="exp-needs-sig-message">
        Set a sound signature for this headphone to see how it colors this song
      </div>
      <button className="btn-modal secondary exp-set-sig-btn" onClick={onSetSignature}>
        Set Signature
      </button>
    </div>
  );
}
