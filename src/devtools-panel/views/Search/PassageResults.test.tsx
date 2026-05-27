/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type VirtualizerOptions = {
  count: number;
  estimateSize: () => number;
  getScrollElement: () => Element | null;
};

const { setViewStateMock, getGameMetaDataMock, getSelectedPassageMock } = vi.hoisted(() => ({
  setViewStateMock: vi.fn<
    (
      view: string,
      key: string,
      value: {
        id: number;
        name: string;
        content: string;
        tags: string[];
        size: null;
        position: null;
      },
    ) => void
  >(),
  getGameMetaDataMock: vi.fn<() => { format: { name: string } }>(),
  getSelectedPassageMock: vi.fn<
    () => {
      id: number;
      name: string;
      content: string;
      tags: string[];
      size: null;
      position: null;
    } | null
  >(),
}));

const { createVirtualizerMock } = vi.hoisted(() => ({
  createVirtualizerMock: vi.fn<
    (options: VirtualizerOptions) => {
      getTotalSize: () => number;
      getVirtualItems: () => Array<{ index: number; size: number; start: number }>;
    }
  >(),
}));

vi.mock('@tanstack/solid-virtual', () => ({
  createVirtualizer: createVirtualizerMock,
}));

vi.mock('../../store', () => ({
  setViewState: setViewStateMock,
  getGameMetaData: getGameMetaDataMock,
  createGetViewState: vi.fn<(view: string, key: string) => typeof getSelectedPassageMock>(
    () => getSelectedPassageMock,
  ),
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
    createVirtualizerMock.mockReset();
    createVirtualizerMock.mockImplementation((options: VirtualizerOptions) => ({
      getTotalSize: () => options.count * 35,
      getVirtualItems: () =>
        Array.from({ length: options.count }, (_, index) => ({
          index,
          size: 35,
          start: index * 35,
        })),
    }));
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

    const opts = createVirtualizerMock.mock.calls[0]![0] as VirtualizerOptions;
    expect(opts.estimateSize()).toBe(35);
    expect(opts.count).toBe(1);
    expect(opts.getScrollElement()).toBeInstanceOf(HTMLElement);
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

  it('should pass active flag to selected row', () => {
    const results = [
      { id: 1, name: 'Intro', content: 'Hello', tags: [], size: null, position: null },
      { id: 2, name: 'Start', content: 'Body', tags: [], size: null, position: null },
    ] as any;
    getSelectedPassageMock.mockReturnValue(results[1]);

    render(() => <PassageResults results={results} />);

    expect(screen.getByTestId('row-Intro').getAttribute('data-active')).toBe('false');
    expect(screen.getByTestId('row-Start').getAttribute('data-active')).toBe('true');
  });

  it('should ignore virtual rows that resolve to missing result entries', () => {
    createVirtualizerMock.mockImplementation((options: VirtualizerOptions) => ({
      getTotalSize: () => options.count * 35,
      getVirtualItems: () => [
        { index: 0, size: 35, start: 0 },
        { index: options.count + 2, size: 35, start: 35 },
      ],
    }));
    const results = [
      { id: 1, name: 'Intro', content: 'Hello', tags: [], size: null, position: null },
    ] as any;

    render(() => <PassageResults results={results} />);

    expect(screen.getByTestId('row-Intro')).toBeTruthy();
    expect(screen.queryByTestId('row-undefined')).toBeNull();
  });
});
