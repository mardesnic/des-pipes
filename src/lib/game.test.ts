import { describe, expect, it } from 'vitest';

import {
  E,
  LEVELS,
  N,
  S,
  SIZES,
  W,
  initialStats,
  isSolved,
  newRound,
  pipeAt,
  recordWin,
  tapTile,
  turn,
  water,
  type Round,
} from './game';

// A 3 × 3 grid with a straight pipe across the middle row.
const across = (turns = [0, 0, 0]): Round => ({
  level: 'veryEasy',
  tap: 1,
  flower: 1,
  pipes: [0, 0, 0, E | W, E | W, E | W, 0, 0, 0],
  turns: [0, 0, 0, ...turns, 0, 0, 0],
});

describe('pipes', () => {
  it('turn a quarter to the right', () => {
    expect(turn(N)).toBe(E);
    expect(turn(W)).toBe(N);
    expect(turn(N | E)).toBe(E | S);
    expect(turn(N | S, 2)).toBe(N | S);
    expect(turn(N | E, 4)).toBe(N | E);
  });

  it('carry the water from the tap to the flower', () => {
    expect(isSolved(across())).toBe(true);
    expect([...water(across()).entries()]).toEqual([
      [3, 0],
      [4, 1],
      [5, 2],
    ]);
  });

  it('stop the water at a pipe turned the wrong way', () => {
    const r = across([0, 1, 0]);
    expect(isSolved(r)).toBe(false);
    expect([...water(r).keys()]).toEqual([3]);
    expect(water(across([1, 0, 0])).size).toBe(0);
  });

  it('turn when tapped, but not once solved or on an empty tile', () => {
    let r = across([0, 1, 0]);
    expect(tapTile(r, 0)).toBe(r);
    r = tapTile(r, 4);
    expect(r.turns[4]).toBe(2);
    expect(isSolved(r)).toBe(true);
    expect(tapTile(r, 3)).toBe(r);
  });
});

describe('new games', () => {
  it('are not solved, and solved by turning each tile back', () => {
    for (const level of LEVELS)
      for (let i = 0; i < 100; i++) {
        const r = newRound(level);
        expect(r.pipes.length).toBe(SIZES[level] ** 2);
        expect(isSolved(r)).toBe(false);
        const back = { ...r, turns: r.turns.map(() => 0) };
        expect(isSolved(back)).toBe(true);
        for (let t = 0; t < r.pipes.length; t++)
          expect(pipeAt(r, t) === 0).toBe(r.pipes[t] === 0);
      }
  });

  it('are not the same game twice in a row', () => {
    let last = newRound('veryEasy');
    for (let i = 0; i < 100; i++) {
      const r = newRound('veryEasy', Math.random, last);
      expect(r.pipes).not.toEqual(last.pipes);
      last = r;
    }
  });

  it('count a win', () => {
    expect(recordWin(initialStats, across()).veryEasy.solved).toBe(1);
    expect(recordWin(initialStats, across([1, 0, 0]))).toBe(initialStats);
  });
});
