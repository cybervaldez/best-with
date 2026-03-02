import type { StrengthBar } from '../data/types';
import { LEVEL_TO_NUMBER, TICK_POSITIONS } from '../data/barMetadata';

interface Props {
  bars: StrengthBar[];
  baseBars?: StrengthBar[];
}

export default function StrengthBars({ bars, baseBars }: Props) {
  const baseMap = baseBars
    ? Object.fromEntries(baseBars.map(b => [b.label, LEVEL_TO_NUMBER[b.level] ?? 3]))
    : null;

  return (
    <div className="strength-bars">
      {bars.map((bar) => {
        const curNum = LEVEL_TO_NUMBER[bar.level] ?? 3;
        const baseNum = baseMap?.[bar.label] ?? null;
        const delta = baseNum !== null ? curNum - baseNum : 0;
        const hasOverlay = baseNum !== null && delta !== 0;

        const curPos = TICK_POSITIONS[curNum - 1];
        const basePos = baseNum !== null ? TICK_POSITIONS[baseNum - 1] : 0;

        return (
          <div className="bar-row" key={bar.label}>
            <span className="bar-label">{bar.label}</span>
            <div className="bar-track">
              {hasOverlay ? (
                <>
                  {/* Dimmed base fill: L → base */}
                  <div className="bar-base-fill" style={{ width: `${basePos}%` }} />
                  {delta < 0 ? (
                    <>
                      {/* Cut void: user → base */}
                      <div
                        className="bar-cut-void"
                        style={{ left: `${curPos}%`, width: `${basePos - curPos}%` }}
                      />
                      {/* Vertical dashed marker at the right edge of user's fill */}
                      <div className="bar-cut-marker" style={{ left: `${curPos}%` }} />
                    </>
                  ) : (
                    /* Boost fill: base → user */
                    <div
                      className="bar-boost-fill"
                      style={{ left: `${basePos}%`, width: `${curPos - basePos}%` }}
                    />
                  )}
                </>
              ) : (
                <div className="bar-fill" data-level={bar.level} />
              )}
            </div>
            {hasOverlay ? (
              <span className={`bar-delta ${delta < 0 ? 'cut' : 'boost'}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            ) : (
              <span className="bar-delta" />
            )}
          </div>
        );
      })}
    </div>
  );
}
