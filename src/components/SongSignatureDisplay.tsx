import type { SongSignature } from '../data/types';
import StrengthBars from './StrengthBars';

interface Props {
  signature: SongSignature;
}

export default function SongSignatureDisplay({ signature }: Props) {
  return (
    <div className="signature-card">
      <div className="signature-header">
        <span className="section-header">Sound Signature</span>
      </div>
      <div className="signature-tags">
        {signature.tags.map((tag) => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </div>
      <StrengthBars bars={signature.bars} />
    </div>
  );
}
