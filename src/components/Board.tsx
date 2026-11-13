import { E, N, S, W, isSolved, sizeOf, water, type Round } from '../lib/game';
import type { Strings } from '../lib/i18n';

// How long the water takes to go through one tile, in milliseconds.
export const FLOW_MS = 70;

// Where each open side of a pipe meets the edge of its tile.
const EDGE: Record<number, string> = {
  [N]: '50 0',
  [E]: '100 50',
  [S]: '50 100',
  [W]: '0 50',
};

// How far each side is turned from the top, in degrees.
const ANGLE: Record<number, number> = { [N]: 0, [E]: 90, [S]: 180, [W]: 270 };

// A pipe from side to side through the middle of the tile: a metal pipe
// with a collar where it meets the next tile, and water inside.
function PipePath({ d, ends }: { d: string; ends: number[] }) {
  return (
    <>
      <path className='pipe__edge' d={d} />
      <path className='pipe__body' d={d} />
      {ends.map((side) => (
        <rect
          key={side}
          className='pipe__collar'
          x={26}
          y={-1}
          width={48}
          height={11}
          rx={3}
          transform={`rotate(${ANGLE[side]} 50 50)`}
        />
      ))}
      <path className='pipe__water' d={d} />
    </>
  );
}

function Pipe({ pipe }: { pipe: number }) {
  const [a, b] = [N, E, S, W].filter((side) => pipe & side);
  return <PipePath d={`M${EDGE[a]} L50 50 L${EDGE[b]}`} ends={[a, b]} />;
}

// The tap the water comes from, on the left of its row.
function Tap({ label }: { label: string }) {
  return (
    <>
      <PipePath d='M40 50 L100 50' ends={[E]} />
      <rect className='tap__body' x={6} y={26} width={46} height={48} rx={14} />
      <rect className='tap__stem' x={24} y={8} width={10} height={20} rx={3} />
      <rect
        className='tap__handle'
        x={4}
        y={-2}
        width={50}
        height={14}
        rx={7}
      />
      <title>{label}</title>
    </>
  );
}

// The flower in its pot, on the right of its row. It is a bud until the
// water comes, then it opens.
function Flower({ open, label }: { open: boolean; label: string }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <>
      <PipePath d='M0 50 L34 50' ends={[W]} />
      <path className='flower__stem' d='M62 30 C 58 10, 66 -10, 62 -26' />
      <ellipse
        className='flower__leaf'
        cx={48}
        cy={8}
        rx={14}
        ry={7}
        transform='rotate(-30 48 8)'
      />
      <ellipse
        className='flower__leaf'
        cx={77}
        cy={-4}
        rx={14}
        ry={7}
        transform='rotate(30 77 -4)'
      />
      {open ? (
        <g className='flower__head'>
          {petals.map((a) => (
            <circle
              key={a}
              className='flower__petal'
              cx={62}
              cy={-48}
              r={15}
              transform={`rotate(${a} 62 -32)`}
            />
          ))}
          <circle className='flower__middle' cx={62} cy={-32} r={11} />
        </g>
      ) : (
        <g className='flower__bud'>
          <ellipse className='flower__petal' cx={62} cy={-34} rx={9} ry={13} />
          <path
            className='flower__leaf'
            d='M51 -30 Q 62 -14, 73 -30 Q 62 -22, 51 -30 Z'
          />
        </g>
      )}
      <path className='pot' d='M30 38 H94 L86 96 H38 Z' />
      <rect className='pot__rim' x={26} y={26} width={72} height={16} rx={5} />
      <title>{label}</title>
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
  // The water reaches a tile this long after it starts to flow.
  const delay = (steps: number) =>
    ({ '--delay': `${steps * FLOW_MS}ms` }) as React.CSSProperties;

  return (
    <div
      className={solved ? 'board board--solved' : 'board'}
      style={
        {
          '--size': size,
          // The flower grows up out of its row: on the top row it needs
          // room above the board.
          '--top': round.flower === 0 ? 0.7 : 0,
        } as React.CSSProperties
      }
    >
      <div
        className='board__bed'
        style={{ gridRow: `1 / span ${size}`, gridColumn: `2 / span ${size}` }}
      />

      <svg
        className='end pipe pipe--wet'
        viewBox='0 0 100 100'
        style={{ gridRow: round.tap + 1, gridColumn: 1 }}
        role='img'
      >
        <Tap label={t.tap} />
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
        className={solved ? 'end pipe pipe--wet' : 'end pipe'}
        viewBox='0 0 100 100'
        style={{
          gridRow: round.flower + 1,
          gridColumn: size + 2,
          ...delay(wet.size),
        }}
        role='img'
      >
        <Flower open={solved} label={t.flower} />
      </svg>
    </div>
  );
}
