/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { createGetViewStateMock, getHistoryIdsMock, setViewStateMock } = vi.hoisted(() => ({
  createGetViewStateMock: vi.fn(),
  getHistoryIdsMock: vi.fn(),
  setViewStateMock: vi.fn(),
}));

vi.mock('../../store', () => ({
  createGetViewState: createGetViewStateMock,
  getHistoryIds: getHistoryIdsMock,
  setViewState: setViewStateMock,
}));

import { HistoryNav } from './HistoryNav';

afterEach(() => cleanup());

describe('HistoryNav', () => {
  let historyId = -1;

  beforeEach(() => {
    createGetViewStateMock.mockReset();
    getHistoryIdsMock.mockReset();
    setViewStateMock.mockReset();

    historyId = -1;
    createGetViewStateMock.mockReturnValue(() => historyId);
    getHistoryIdsMock.mockReturnValue([5, 4, 3]);
  });

  it('should render latest plus historical entries', () => {
    render(() => <HistoryNav />);

    expect(screen.getByText('latest')).toBeTruthy();
    expect(screen.getByText('-1')).toBeTruthy();
    expect(screen.getByText('-2')).toBeTruthy();
  });

  it('should set selected history id when a history button is clicked', () => {
    render(() => <HistoryNav />);
    fireEvent.click(screen.getByRole('button', { name: '-1' }));

    expect(setViewStateMock).toHaveBeenCalledWith('state', 'historyId', 4);
  });

  it('should set latest history id to -1 when latest is clicked', () => {
    render(() => <HistoryNav />);
    fireEvent.click(screen.getByRole('button', { name: 'latest' }));

    expect(setViewStateMock).toHaveBeenCalledWith('state', 'historyId', -1);
  });

  it('should highlight latest when historyId is -1', () => {
    historyId = -1;
    const { container } = render(() => <HistoryNav />);

    const rings = container.querySelectorAll('.outline-2.outline-offset-2');
    expect(rings).toHaveLength(1);
    expect(screen.getByText('latest').closest('.outline-2.outline-offset-2')).toBeTruthy();
  });

  it('should highlight only selected historical entry when historyId matches item id', () => {
    historyId = 4;
    const { container } = render(() => <HistoryNav />);

    const rings = container.querySelectorAll('.outline-2.outline-offset-2');
    expect(rings).toHaveLength(1);
    expect(screen.getByText('-1').closest('.outline-2.outline-offset-2')).toBeTruthy();
    expect(screen.getByText('latest').closest('.outline-2.outline-offset-2')).toBeFalsy();
  });

  it('should not highlight any entry when historyId does not match and is not -1', () => {
    historyId = 999;
    const { container } = render(() => <HistoryNav />);

    const rings = container.querySelectorAll('.outline-2.outline-offset-2');
    expect(rings).toHaveLength(0);
  });
});
