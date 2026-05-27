/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type AnyFn = (...args: any[]) => any;

const { createGetSettingMock, setNavigationPageMock, setViewStateMock } = vi.hoisted(() => ({
  createGetSettingMock: vi.fn<AnyFn>(),
  setNavigationPageMock: vi.fn<AnyFn>(),
  setViewStateMock: vi.fn<AnyFn>(),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetSetting: createGetSettingMock,
  setNavigationPage: setNavigationPageMock,
  setViewState: setViewStateMock,
}));

vi.mock('./Diff', () => ({
  DiffItem: (props: { diff: { path?: Array<string | number> } }) => (
    <div data-testid="diff-item">{props.diff.path?.join('.') ?? 'diff'}</div>
  ),
}));

vi.mock('./RelativeTime', () => ({
  RelativeTime: () => <span data-testid="relative-time">now</span>,
}));

import { DiffFrame } from './DiffFrame';

describe('DiffFrame', () => {
  beforeEach(() => {
    createGetSettingMock.mockReset();
    setNavigationPageMock.mockReset();
    setViewStateMock.mockReset();
    createGetSettingMock.mockReturnValue(() => 14);
  });

  afterEach(() => cleanup());

  it('should render frame details with configured font size and no separator for first entry', () => {
    const { container } = render(() => (
      <DiffFrame
        first
        frame={{
          timestamp: new Date('2026-05-26T12:00:00.000Z'),
          passage: 'Start',
          changes: [{ type: 'string', path: ['player', 'name'], oldValue: 'A', newValue: 'B' }],
        }}
      />
    ));

    expect(createGetSettingMock).toHaveBeenCalledWith('diffLog.fontSize');
    expect(container.querySelector('.group')?.getAttribute('style')).toBe('font-size: 14px;');
    expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy();
    expect(screen.getByTestId('relative-time')).toBeTruthy();
    expect(screen.getByTestId('diff-item')).toBeTruthy();

    const header = container.querySelector('.flex.items-center.gap-2');
    expect(header).toBeInstanceOf(HTMLDivElement);
    expect((header as HTMLDivElement).className.includes('mt-3')).toBe(false);
  });

  it('should add separator for non-first frame and navigate to matched passage', () => {
    const passage = {
      id: 3,
      name: 'Forest',
      size: null,
      position: null,
      content: 'Explore',
      tags: ['map'],
    };

    const { container } = render(() => (
      <DiffFrame
        frame={{
          timestamp: new Date('2026-05-26T12:00:00.000Z'),
          passage: 'Forest',
          changes: [{ type: 'string', path: ['x'], oldValue: '1', newValue: '2' }],
        }}
        passageData={[passage]}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Forest' }));

    expect(setNavigationPageMock).toHaveBeenCalledWith('passages');
    expect(setViewStateMock).toHaveBeenCalledWith('passage', 'selected', { ...passage });

    const header = container.querySelector('.flex.items-center.gap-2');
    expect(header).toBeInstanceOf(HTMLDivElement);
    expect((header as HTMLDivElement).className.includes('mt-3')).toBe(true);
  });

  it('should skip selected passage update when no matching passage exists', () => {
    render(() => (
      <DiffFrame
        frame={{
          timestamp: new Date('2026-05-26T12:00:00.000Z'),
          passage: 'Missing Passage',
          changes: [{ type: 'string', path: ['x'], oldValue: '1', newValue: '2' }],
        }}
        passageData={[]}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Missing Passage' }));

    expect(setNavigationPageMock).toHaveBeenCalledWith('passages');
    expect(setViewStateMock.mock.calls).toStrictEqual([]);
  });

  it('should not attempt selected passage update when passageData is undefined', () => {
    render(() => (
      <DiffFrame
        frame={{
          timestamp: new Date('2026-05-26T12:00:00.000Z'),
          passage: 'Start',
          changes: [{ type: 'string', path: ['x'], oldValue: '1', newValue: '2' }],
        }}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(setNavigationPageMock).toHaveBeenCalledWith('passages');
    expect(setViewStateMock.mock.calls).toStrictEqual([]);
  });
});
