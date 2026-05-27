/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../ui/util/MovableSplit', () => ({
  MovableSplit: (props: { leftContent: unknown; rightContent: unknown }) => (
    <div>
      <div data-testid="left-pane">{props.leftContent as any}</div>
      <div data-testid="right-pane">{props.rightContent as any}</div>
    </div>
  ),
}));

vi.mock('../views/DiffLog', () => ({
  DiffLog: () => <div data-testid="diff-log" />,
}));

vi.mock('../views/State/HistoryNav', () => ({
  HistoryNav: () => <div data-testid="history-nav" />,
}));

vi.mock('../views/State/StateView', () => ({
  StateView: () => <div data-testid="state-view" />,
}));

import { StatePage } from './StatePage';

afterEach(() => cleanup());

describe('StatePage', () => {
  it('should compose diff log, history nav, and state view in split layout', () => {
    render(() => <StatePage />);

    expect(screen.getByTestId('left-pane')).toBeTruthy();
    expect(screen.getByTestId('right-pane')).toBeTruthy();
    expect(screen.getByTestId('diff-log')).toBeTruthy();
    expect(screen.getByTestId('history-nav')).toBeTruthy();
    expect(screen.getByTestId('state-view')).toBeTruthy();
  });
});
