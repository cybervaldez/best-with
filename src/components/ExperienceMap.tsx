import type { Headphone, HeadphoneSignature, SongSignature, ExperienceNote } from '../data/types';
import type { SpectrumSlot } from '../data/spectrumBuilder';
import ExperienceCard, { ExperienceCardNeedsSig } from './ExperienceCard';
import CategoryBadge from './CategoryBadge';

type ViewMode = 'spectrum' | 'collection';

interface Props {
  headphones: Headphone[];
  songSignature: SongSignature | null;
  headphoneSignatures: Record<string, HeadphoneSignature>;
  experienceNotes: Record<string, ExperienceNote | null>;
  onEditExperience: (hp: Headphone) => void;
  onSetHpSignature: (hp: Headphone) => void;
  // Spectrum props
  viewMode: ViewMode;
  onToggleView: (mode: ViewMode) => void;
  spectrumSlots: SpectrumSlot[];
  spectrumHeadphones: Record<string, Headphone>;
  spectrumSignatures: Record<string, HeadphoneSignature>;
  onRerollSlot: (category: string) => void;
}

export default function ExperienceMap({
  headphones, songSignature, headphoneSignatures, experienceNotes,
  onEditExperience, onSetHpSignature,
  viewMode, onToggleView, spectrumSlots, spectrumHeadphones, spectrumSignatures,
  onRerollSlot,
}: Props) {
  // Disabled state — no song signature
  if (!songSignature) {
    return (
      <section data-testid="experience-map">
        <div className="section-header">
          <span>experience map</span>
          <div className="exp-view-toggle">
            <button
              className={`exp-toggle-btn ${viewMode === 'spectrum' ? 'active' : ''}`}
              onClick={() => onToggleView('spectrum')}
            >Spectrum</button>
            <button
              className={`exp-toggle-btn ${viewMode === 'collection' ? 'active' : ''}`}
              onClick={() => onToggleView('collection')}
            >Collection</button>
          </div>
        </div>
        <div className="exp-disabled" data-testid="exp-disabled">
          <div className="exp-disabled-icon">{'\u{1F3A7}'}</div>
          <div className="exp-disabled-title">Get the song's sound signature</div>
          <div className="exp-disabled-text">
            to see how your headphones color this track
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="experience-map">
      <div className="section-header">
        <span>experience map</span>
        <div className="exp-view-toggle">
          <button
            className={`exp-toggle-btn ${viewMode === 'spectrum' ? 'active' : ''}`}
            onClick={() => onToggleView('spectrum')}
          >Spectrum</button>
          <button
            className={`exp-toggle-btn ${viewMode === 'collection' ? 'active' : ''}`}
            onClick={() => onToggleView('collection')}
          >Collection</button>
        </div>
      </div>

      {viewMode === 'collection' ? (
        // ── Collection view (existing behavior) ──
        headphones.length === 0 ? (
          <div className="exp-disabled" data-testid="exp-empty-collection">
            <div className="exp-disabled-icon">{'\u{1F3A7}'}</div>
            <div className="exp-disabled-title">Add headphones to your collection</div>
            <div className="exp-disabled-text">
              to compare how they shape this song's sound
            </div>
          </div>
        ) : (
          headphones.map((hp) => {
            const hpSig = headphoneSignatures[hp.id];
            if (!hpSig) {
              return (
                <ExperienceCardNeedsSig
                  key={hp.id}
                  headphone={hp}
                  onSetSignature={() => onSetHpSignature(hp)}
                />
              );
            }
            return (
              <ExperienceCard
                key={hp.id}
                headphone={hp}
                hpSignature={hpSig}
                songSignature={songSignature}
                storedNote={experienceNotes[hp.id] ?? null}
                onEdit={() => onEditExperience(hp)}
              />
            );
          })
        )
      ) : (
        // ── Spectrum view ──
        spectrumSlots.map((slot) => {
          // Empty category — no preset available
          if (slot.source === 'none' || !slot.presetId) {
            return (
              <div key={slot.category} className="spectrum-slot spectrum-slot-empty">
                <div className="spectrum-slot-header">
                  <CategoryBadge category={slot.category} />
                  <span className="spectrum-slot-coming-soon">Coming Soon</span>
                </div>
              </div>
            );
          }

          const hp = spectrumHeadphones[slot.presetId];
          const hpSig = spectrumSignatures[slot.presetId];
          const hasAlternatives = slot.alternatives.length > 0;

          if (!hp) return null;

          return (
            <div key={slot.category} className="spectrum-slot" data-testid={`spectrum-slot-${slot.category}`}>
              <div className="spectrum-slot-header">
                <CategoryBadge category={slot.category} />
                <span className="spectrum-slot-name">{hp.name}</span>
                <span className={`spectrum-source-pill spectrum-source-${slot.source}`}>
                  {slot.source === 'collection' ? 'Mine' : 'Preset'}
                </span>
                {hasAlternatives && (
                  <button
                    className="spectrum-dice-btn"
                    onClick={() => onRerollSlot(slot.category)}
                    title="Try a different headphone for this category"
                  >
                    {'\u{1F3B2}'}
                  </button>
                )}
              </div>
              {hpSig ? (
                <ExperienceCard
                  headphone={hp}
                  hpSignature={hpSig}
                  songSignature={songSignature}
                  storedNote={experienceNotes[slot.presetId] ?? null}
                  onEdit={() => onEditExperience(hp)}
                />
              ) : (
                <ExperienceCardNeedsSig
                  headphone={hp}
                  onSetSignature={() => onSetHpSignature(hp)}
                />
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
