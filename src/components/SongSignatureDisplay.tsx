import type { SongSignature } from '../data/types';
import StrengthBars from './StrengthBars';

interface Props {
  signature: SongSignature;
  onEdit: () => void;
}

export default function SongSignatureDisplay({ signature, onEdit }: Props) {
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
      <div className="signature-tags">
        {signature.tags.map((tag) => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </div>
      {signature.sections && signature.sections.length > 0 && (
        <div className="signature-sections">
          {signature.sections.map((s, i) => (
            <div className="signature-section" key={i}>
              <span className="sig-section-time">{s.time}</span>
              <span className="sig-section-label">{s.label}</span>
              <span className="sig-section-desc">{s.description}</span>
            </div>
          ))}
        </div>
      )}
      <StrengthBars bars={signature.bars} />
    </div>
  );
}
