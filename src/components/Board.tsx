import { E, N, S, W, isSolved, sizeOf, water, type Round } from '../lib/game';
import type { Strings } from '../lib/i18n';

// How long the water takes to go through one tile, in milliseconds.
export const FLOW_MS = 70;

// Where each open side of a pipe ends, from the middle of its tile.
const ENDS = [
  [N, 50, -2],
  [E, 102, 50],
  [S, 50, 102],
  [W, -2, 50],
] as const;

function Pipe({ pipe }: { pipe: number }) {
  return (
    <>
      {ENDS.filter(([side]) => pipe & side).map(([side, x, y]) => (
        <line key={side} x1={50} y1={50} x2={x} y2={y} />
      ))}
      <circle cx={50} cy={50} r={15} />
    </>
  );
}

export function Board({
  round,
  onTile,
  t,
}: {
  round: Round;
  onTile: (tile: number) => void;
  t: Strings;
}) {
  const size = sizeOf(round);
  const wet = water(round);
  const solved = isSolved(round);
  const delay = (steps: number) => ({
    transitionDelay: `${steps * FLOW_MS}ms`,
  });

  return (
    <div
      className={solved ? 'board board--solved' : 'board'}
      style={
        {
          '--size': size,
          '--cols': size + 1.4,
          '--rows': size,
        } as React.CSSProperties
      }
    >
      <svg
        className='end end--tap pipe pipe--wet'
        viewBox='0 0 100 100'
        style={{ gridRow: round.tap + 1, gridColumn: 1 }}
        role='img'
        aria-label={t.tap}
      >
        <line x1={50} y1={50} x2={110} y2={50} />
        <circle cx={46} cy={50} r={34} />
        <circle className='end__shine' cx={34} cy={38} r={9} />
      </svg>

      {round.pipes.map((pipe, i) => {
        const place = {
          gridRow: Math.floor(i / size) + 1,
          gridColumn: (i % size) + 2,
        };
        if (!pipe) return <div key={i} className='tile' style={place} />;
        const steps = wet.get(i);
        return (
          <button
            key={i}
            className='tile'
            style={place}
            onClick={() => onTile(i)}
            disabled={solved}
            aria-label={`${t.tile} ${i + 1}`}
          >
            <svg
              className={steps === undefined ? 'pipe' : 'pipe pipe--wet'}
              viewBox='0 0 100 100'
              style={{
                transform: `rotate(${round.turns[i] * 90}deg)`,
                ...delay(steps ?? 0),
              }}
            >
              <Pipe pipe={pipe} />
            </svg>
          </button>
        );
      })}

      <svg
        className={
          solved ? 'end end--flower pipe pipe--wet' : 'end end--flower pipe'
        }
        viewBox='0 0 100 100'
        style={{
          gridRow: round.flower + 1,
          gridColumn: size + 2,
          ...delay(wet.size),
        }}
        role='img'
        aria-label={t.flower}
      >
        <line x1={-10} y1={50} x2={40} y2={50} />
        <text
          className='end__flower'
          x={58}
          y={54}
          textAnchor='middle'
          dominantBaseline='central'
        >
          {solved ? '🌷' : '🌱'}
        </text>
      </svg>
    </div>
  );
}
