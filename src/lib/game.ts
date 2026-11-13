// Pipe tiles lie on a grid, turned the wrong way. Tap a tile to turn it a
// quarter to the right. When the pipes join up from the tap on the left to
// the flower on the right, the water reaches the flower and it blooms.

export const LEVELS = ['veryEasy', 'easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

// The grid of each level is this many tiles across and down.
export const SIZES: Record<Level, number> = {
  veryEasy: 3,
  easy: 4,
  medium: 5,
  hard: 6,
};

// The fewest tiles on the way from the tap to the flower.
const MIN_PATH: Record<Level, number> = {
  veryEasy: 4,
  easy: 6,
  medium: 9,
  hard: 13,
};

// How many of the tiles off the way get a pipe too, to make it harder.
const EXTRA: Record<Level, number> = {
  veryEasy: 0,
  easy: 0.35,
  medium: 0.7,
  hard: 1,
};

// A pipe's open sides, as bits.
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

// The pipe turned a quarter to the right `times` times.
export function turn(pipe: number, times = 1): number {
  let p = pipe;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++)
    p = ((p << 1) | (p >> 3)) & 15;
  return p;
}

export type Round = {
  level: Level;
  // The rows of the tap, on the left, and the flower, on the right.
  tap: number;
  flower: number;
  // Each tile's pipe as it lies when solved, 0 for no pipe; row by row from
  // the top left.
  pipes: number[];
  // How many quarters each tile has been turned since. It only grows, so a
  // tile always spins the same way.
  turns: number[];
};

export const sizeOf = (round: Round) => SIZES[round.level];

// The pipe on a tile as it lies now.
export const pipeAt = (round: Round, tile: number) =>
  turn(round.pipes[tile], round.turns[tile]);

const STEPS = [
  [N, -1, 0, S],
  [E, 0, 1, W],
  [S, 1, 0, N],
  [W, 0, -1, E],
] as const;

// The tiles the water reaches, each with how many tiles it went through
// to get there, from the tap's tile on.
export function water(round: Round): Map<number, number> {
  const size = sizeOf(round);
  const reached = new Map<number, number>();
  const first = round.tap * size;
  if (!(pipeAt(round, first) & W)) return reached;
  reached.set(first, 0);
  const queue = [first];
  while (queue.length) {
    const tile = queue.shift()!;
    const pipe = pipeAt(round, tile);
    const row = Math.floor(tile / size);
    const col = tile % size;
    for (const [side, dr, dc, back] of STEPS) {
      if (!(pipe & side)) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || c < 0 || r >= size || c >= size) continue;
      const next = r * size + c;
      if (reached.has(next) || !(pipeAt(round, next) & back)) continue;
      reached.set(next, reached.get(tile)! + 1);
      queue.push(next);
    }
  }
  return reached;
}

export function isSolved(round: Round) {
  const size = sizeOf(round);
  const last = round.flower * size + size - 1;
  return water(round).has(last) && !!(pipeAt(round, last) & E);
}

// Turns a tile a quarter to the right. Nothing changes once it is solved.
export function tapTile(round: Round, tile: number): Round {
  if (isSolved(round) || !round.pipes[tile]) return round;
  const turns = [...round.turns];
  turns[tile]++;
  return { ...round, turns };
}

// A random way across the grid, from the left side in `tap`'s row to the
// right side in `flower`'s row, through at least `min` tiles.
function findPath(
  size: number,
  tap: number,
  flower: number,
  min: number,
  random: () => number
): number[] | undefined {
  const path = [tap * size];
  const seen = new Set(path);
  const goal = flower * size + size - 1;
  let steps = 0;
  const walk = (): boolean => {
    if (++steps > 20000) return false;
    const tile = path[path.length - 1];
    if (tile === goal) return path.length >= min;
    const row = Math.floor(tile / size);
    const col = tile % size;
    const next = STEPS.map(([, dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => r >= 0 && c >= 0 && r < size && c < size)
      .map(([r, c]) => r * size + c)
      .filter((t) => !seen.has(t))
      .sort(() => random() - 0.5);
    for (const t of next) {
      path.push(t);
      seen.add(t);
      if (walk()) return true;
      path.pop();
      seen.delete(t);
    }
    return false;
  };
  return walk() ? path : undefined;
}

const sideTo = (size: number, from: number, to: number) =>
  to === from - size ? N : to === from + 1 ? E : to === from + size ? S : W;

const sameRound = (a: Round, b: Round) =>
  a.level === b.level && a.pipes.join() === b.pipes.join();

// A new game for the level, not the same as `last`.
export function newRound(
  level: Level,
  random = Math.random,
  last?: Round
): Round {
  const size = SIZES[level];
  const pick = (n: number) => Math.floor(random() * n);
  for (;;) {
    const tap = pick(size);
    const flower = pick(size);
    const path = findPath(size, tap, flower, MIN_PATH[level], random);
    if (!path) continue;

    const pipes = Array<number>(size * size).fill(0);
    path.forEach((tile, i) => {
      pipes[tile] =
        (i === 0 ? W : sideTo(size, tile, path[i - 1])) |
        (i === path.length - 1 ? E : sideTo(size, tile, path[i + 1]));
    });
    // Other tiles get a straight pipe or a bend, to make it harder.
    for (let t = 0; t < pipes.length; t++)
      if (!pipes[t] && random() < EXTRA[level])
        pipes[t] = random() < 0.4 ? N | S : N | E;

    // Every pipe on the way starts turned wrong.
    const turns = pipes.map((p, t) => {
      if (!p) return 0;
      if (!path.includes(t)) return pick(4);
      const straight = p === (N | S) || p === (E | W);
      return straight ? 1 + 2 * pick(2) : 1 + pick(3);
    });

    const round: Round = { level, tap, flower, pipes, turns };
    if (isSolved(round) || (last && sameRound(last, round))) continue;
    return round;
  }
}

export type Store = { round?: Round };

export const initialStore: Store = {};

export type Stats = { [L in Level]: { solved: number } };

export const initialStats = Object.fromEntries(
  LEVELS.map((l) => [l, { solved: 0 }])
) as Stats;

export const recordWin = (stats: Stats, round: Round): Stats =>
  isSolved(round)
    ? {
        ...stats,
        [round.level]: { solved: (stats[round.level]?.solved ?? 0) + 1 },
      }
    : stats;
