import { describe, expect, it } from 'vite-plus/test';

import type {
  CandidateGameIframes,
  DiffArrayInstruction,
  DiffFrame,
  Path,
  SearchResultsCombined,
  UpdateResult,
} from './shared-types';

describe('shared-types contracts', () => {
  it('should model candidate game iframe payload', () => {
    const candidate: CandidateGameIframes = {
      __type: 'candidate-game-iframes',
      urls: ['https://example.test/game'],
    };

    expect(candidate.__type).toBe('candidate-game-iframes');
    expect(candidate.urls).toEqual(['https://example.test/game']);
  });

  it('should model array instruction diff and update result payload', () => {
    const path: Path = ['inventory'];
    const instructionDiff: DiffArrayInstruction = {
      type: 'array',
      subtype: 'instructions',
      path,
      instructions: [{ type: 'add', index: 0, value: 'rope' }],
    };

    const frame: DiffFrame = {
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      passage: 'Start',
      changes: [instructionDiff],
    };

    const result: UpdateResult = {
      diffPackage: {
        passage: frame.passage,
        diffs: frame.changes,
      },
      locksUpdate: [path],
    };

    expect(result.diffPackage?.passage).toBe('Start');
    expect(result.diffPackage?.diffs[0]).toEqual(instructionDiff);
    expect(result.locksUpdate).toEqual([['inventory']]);
  });

  it('should model combined search results with state and passage entries', () => {
    const results: SearchResultsCombined = {
      state: [{ path: ['player', 'hp'], value: 10 }],
      passage: [
        {
          id: 1,
          name: 'Start',
          size: [100, 80],
          position: [0, 0],
          content: 'Hello world',
          tags: ['intro'],
        },
      ],
    };

    expect(results.state[0]?.path).toEqual(['player', 'hp']);
    expect(results.passage[0]?.name).toBe('Start');
  });
});
