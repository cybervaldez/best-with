import type { Headphone, HeadphoneSignature, SongSignature, ExperienceNote, CustomCategoryDef } from '../data/types';
import ExperienceCard, { ExperienceCardNeedsSig } from './ExperienceCard';

interface Props {
  headphones: Headphone[];
  songSignature: SongSignature | null;
  headphoneSignatures: Record<string, HeadphoneSignature>;
  experienceNotes: Record<string, ExperienceNote | null>;
  customCategories?: CustomCategoryDef[];
  onEditExperience: (hp: Headphone) => void;
  onSetHpSignature: (hp: Headphone) => void;
}

export default function ExperienceMap({
  headphones, songSignature, headphoneSignatures, experienceNotes,
  customCategories, onEditExperience, onSetHpSignature,
}: Props) {
  // Disabled state — no song signature
  if (!songSignature) {
    return (
      <section data-testid="experience-map">
        <div className="section-header">
          <span>experience map</span>
          <span className="section-header-accent">{'\u25C8 \u25C8 \u25C8'}</span>
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

  // No headphones in collection
  if (headphones.length === 0) {
    return (
      <section data-testid="experience-map">
        <div className="section-header">
          <span>experience map</span>
          <span className="section-header-accent">{'\u25C8 \u25C8 \u25C8'}</span>
        </div>
        <div className="exp-disabled" data-testid="exp-empty-collection">
          <div className="exp-disabled-icon">{'\u{1F3A7}'}</div>
          <div className="exp-disabled-title">Add headphones to your collection</div>
          <div className="exp-disabled-text">
            to compare how they shape this song's sound
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="experience-map">
      <div className="section-header">
        <span>experience map</span>
        <span className="section-header-accent">{'\u25C8 \u25C8 \u25C8'}</span>
      </div>
      {headphones.map((hp) => {
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
            customCategories={customCategories}
            onEdit={() => onEditExperience(hp)}
          />
        );
      })}
    </section>
  );
}
