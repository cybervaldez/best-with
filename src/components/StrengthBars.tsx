import { StrengthBar } from '../data/types';

interface Props {
  bars: StrengthBar[];
}

export default function StrengthBars({ bars }: Props) {
  return (
    <div className="strength-bars">
      {bars.map((bar) => (
        <div className="bar-row" key={bar.label}>
          <span className="bar-label">{bar.label}</span>
          <div className="bar-track">
            <div className="bar-fill" data-level={bar.level} />
          </div>
        </div>
      ))}
    </div>
  );
}
