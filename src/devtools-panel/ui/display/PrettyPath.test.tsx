/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const getActiveStateMock = vi.hoisted(() => vi.fn());

vi.mock('@/devtools-panel/store', () => ({
  getActiveState: getActiveStateMock,
}));

import { PrettyPath } from './PrettyPath';

afterEach(() => cleanup());

describe('PrettyPath', () => {
  beforeEach(() => {
    getActiveStateMock.mockReset();
    getActiveStateMock.mockReturnValue({
      player: {
        'hp': 10,
        'bad key': 'x',
      },
      arr: ['a'],
      map: new Map([[1, 'one']]),
      obj: { nested: { x: 1 } },
    });
  });

  it('should render dot notation for valid object keys', () => {
    render(() => <PrettyPath path={['player', 'hp']} statePrefix />);

    expect(screen.getByText('State')).toBeTruthy();
    expect(screen.getByText('player')).toBeTruthy();
    expect(screen.getByText('hp')).toBeTruthy();
  });

  it('should render bracket notation for invalid identifiers', () => {
    render(() => <PrettyPath path={['player', 'bad key']} />);

    expect(screen.getByText('"bad key"')).toBeTruthy();
  });

  it('should render array and map segments with container notation', () => {
    render(() => <PrettyPath path={['arr', 0]} />);
    expect(screen.getByText('0')).toBeTruthy();

    cleanup();
    render(() => <PrettyPath path={['map', 1]} />);
    expect(screen.getByText('get')).toBeTruthy();
  });

  it('should render glob suffix when target path resolves to an object', () => {
    render(() => <PrettyPath path={['obj']} globSuffix />);

    expect(screen.getByText('*')).toBeTruthy();
  });
});
