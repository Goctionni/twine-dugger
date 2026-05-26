/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  clearDiffFramesMock,
  clearFilteredPathsMock,
  createContextMenuHandlerMock,
  diffFrameProps,
  getDiffFramesMock,
  isPathFilteredMock,
} = vi.hoisted(() => ({
  clearDiffFramesMock: vi.fn(),
  clearFilteredPathsMock: vi.fn(),
  createContextMenuHandlerMock: vi.fn(),
  diffFrameProps: [] as Array<{ frame: { passage: string }; first?: boolean }>,
  getDiffFramesMock: vi.fn(),
  isPathFilteredMock: vi.fn(),
}));

vi.mock('../../store', () => ({
  clearDiffFrames: clearDiffFramesMock,
  clearFilteredPaths: clearFilteredPathsMock,
  getDiffFrames: getDiffFramesMock,
  isPathFiltered: isPathFilteredMock,
}));

vi.mock('../../ui/util/ContextMenu', () => ({
  createContextMenuHandler: createContextMenuHandlerMock,
}));

vi.mock('./DiffFrame', () => ({
  DiffFrame: (props: { frame: { passage: string }; first?: boolean }) => {
    diffFrameProps.push(props);
    return <div data-testid="diff-frame">{props.frame.passage}</div>;
  },
}));

import { DiffLog } from './index';

describe('DiffLog', () => {
  beforeEach(() => {
    diffFrameProps.length = 0;
    clearDiffFramesMock.mockReset();
    clearFilteredPathsMock.mockReset();
    createContextMenuHandlerMock.mockReset();
    getDiffFramesMock.mockReset();
    isPathFilteredMock.mockReset();
    createContextMenuHandlerMock.mockReturnValue(() => undefined);
    isPathFilteredMock.mockReturnValue(false);
  });

  afterEach(() => cleanup());

  it('should pass context menu items and render only frames with unfiltered changes', () => {
    getDiffFramesMock.mockReturnValue([
      {
        passage: 'Start',
        timestamp: new Date('2026-05-26T12:00:00.000Z'),
        changes: [{ path: ['show'] }, { path: ['hide'] }],
      },
      {
        passage: 'FilteredOut',
        timestamp: new Date('2026-05-26T12:00:00.000Z'),
        changes: [{ path: ['hide'] }],
      },
    ]);

    isPathFilteredMock.mockImplementation((path: Array<string>) => path[0] === 'hide');

    render(() => <DiffLog />);

    expect(createContextMenuHandlerMock).toHaveBeenCalledWith([
      { label: 'Clear Diff Log', onClick: expect.any(Function) },
      { label: 'Clear All Filters', onClick: expect.any(Function) },
    ]);
    expect(screen.getByRole('heading', { name: 'Diff Log' })).toBeTruthy();
    expect(screen.getAllByTestId('diff-frame')).toHaveLength(1);
    expect(screen.getByText('Start')).toBeTruthy();
    expect(diffFrameProps[0]?.first).toBe(true);
  });

  it('should limit rendered frames to first 30 entries', () => {
    getDiffFramesMock.mockReturnValue(
      Array.from({ length: 35 }, (_, i) => ({
        passage: `P${i + 1}`,
        timestamp: new Date('2026-05-26T12:00:00.000Z'),
        changes: [{ path: ['keep'] }],
      })),
    );

    render(() => <DiffLog />);

    expect(screen.getAllByTestId('diff-frame')).toHaveLength(30);
    expect(screen.getByText('P1')).toBeTruthy();
    expect(screen.getByText('P30')).toBeTruthy();
    expect(screen.queryByText('P31')).toBeNull();
    expect(diffFrameProps[0]?.first).toBe(true);
    expect(diffFrameProps[1]?.first).toBe(false);
  });
});
