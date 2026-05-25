/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { setViewStateMock, getGameMetaDataMock, getSelectedPassageMock } = vi.hoisted(() => ({
  setViewStateMock: vi.fn(),
  getGameMetaDataMock: vi.fn(),
  getSelectedPassageMock: vi.fn(),
}));

vi.mock('@tanstack/solid-virtual', () => ({
  createVirtualizer: vi.fn((options: { count: number }) => ({
    getTotalSize: () => options.count * 35,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({ index, size: 35, start: index * 35 })),
  })),
}));

vi.mock('../../store', () => ({
  setViewState: setViewStateMock,
  getGameMetaData: getGameMetaDataMock,
  createGetViewState: vi.fn(() => getSelectedPassageMock),
}));

vi.mock('../../ui/util/MovableSplit', () => ({
  MovableSplit: (props: { leftContent: unknown; rightContent: unknown }) => (
    <div>
      <div data-testid="left-pane">{props.leftContent as any}</div>
      <div data-testid="right-pane">{props.rightContent as any}</div>
    </div>
  ),
}));

vi.mock('@/devtools-panel/ui/code', () => ({
  Code: (props: { code: string; format: string }) => (
    <div data-testid="code-view">
      {props.format}:{props.code}
    </div>
  ),
}));

vi.mock('../Passage/PassageHeader', () => ({
  PassageHeader: (props: { passage: { name: string } }) => (
    <div data-testid="passage-header">{props.passage.name}</div>
  ),
}));

vi.mock('../Passage/PassageListItem', () => ({
  PassageListItem: (props: {
    passageData: { name: string };
    onClick: () => void;
    active?: boolean;
  }) => (
    <button
      type="button"
      data-testid={`row-${props.passageData.name}`}
      data-active={String(!!props.active)}
      onClick={() => props.onClick()}
    >
      {props.passageData.name}
    </button>
  ),
}));

import { PassageResults } from './PassageResults';

afterEach(() => cleanup());

describe('PassageResults', () => {
  beforeEach(() => {
    setViewStateMock.mockReset();
    getGameMetaDataMock.mockReset();
    getSelectedPassageMock.mockReset();
    getGameMetaDataMock.mockReturnValue({ format: { name: 'SugarCube' } });
    getSelectedPassageMock.mockReturnValue(null);
  });

  it('should dispatch selected passage to view state when row is clicked', () => {
    const results = [
      { id: 1, name: 'Intro', content: 'Hello', tags: [], size: null, position: null },
    ] as any;
    render(() => <PassageResults results={results} />);

    fireEvent.click(screen.getByTestId('row-Intro'));

    expect(setViewStateMock).toHaveBeenCalledWith('passage', 'selected', {
      id: 1,
      name: 'Intro',
      content: 'Hello',
      tags: [],
      size: null,
      position: null,
    });
  });

  it('should render selected passage header and code in right pane', () => {
    getSelectedPassageMock.mockReturnValue({
      id: 2,
      name: 'Start',
      content: 'Body',
      tags: [],
      size: null,
      position: null,
    });
    render(() => <PassageResults results={[]} />);

    expect(screen.getByTestId('passage-header').textContent).toBe('Start');
    expect(screen.getByTestId('code-view').textContent).toBe('SugarCube:Body');
  });

  it('should keep right pane empty when no passage is selected', () => {
    getSelectedPassageMock.mockReturnValue(null);
    render(() => <PassageResults results={[]} />);

    expect(screen.queryByTestId('passage-header')).toBeNull();
    expect(screen.queryByTestId('code-view')).toBeNull();
  });
});
