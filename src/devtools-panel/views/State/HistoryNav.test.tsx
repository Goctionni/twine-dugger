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
  beforeEach(() => {
    createGetViewStateMock.mockReset();
    getHistoryIdsMock.mockReset();
    setViewStateMock.mockReset();
    createGetViewStateMock.mockReturnValue(() => -1);
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
});
