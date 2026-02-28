import type { Headphone, HeadphoneSignature, SongSignature, ExperienceNote } from '../data/types';
import { deriveExperienceNote } from '../data/experienceDerive';
import StrengthBars from './StrengthBars';

interface Props {
  headphone: Headphone;
  hpSignature: HeadphoneSignature;
  songSignature: SongSignature;
  storedNote: ExperienceNote | null;
  onEdit: () => void;
}

export default function ExperienceCard({
  headphone, hpSignature, songSignature, storedNote, onEdit,
}: Props) {
  // Use stored note if available, otherwise auto-derive from song+HP signature comparison
  const note: ExperienceNote = storedNote ?? deriveExperienceNote(hpSignature.bars, songSignature.bars);

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
      <div className="hp-tagline">{'\u201C'}{note.tagline}{'\u201D'}</div>
      <div className="hp-description">{note.description}</div>
      <StrengthBars bars={hpSignature.bars} />
      {note.source !== 'auto' && (
        <div className="exp-source-indicator" data-testid={`exp-source-${headphone.id}`}>
          {note.source === 'llm' ? 'AI-enriched' : 'Custom'}
        </div>
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
