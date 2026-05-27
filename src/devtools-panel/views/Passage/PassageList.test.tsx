/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { createVirtualizerMock } = vi.hoisted(() => ({
  createVirtualizerMock: vi.fn<(...args: any[]) => any>(),
}));

vi.mock('@tanstack/solid-virtual', () => ({
  createVirtualizer: createVirtualizerMock,
}));

vi.mock('./PassageListItem', () => ({
  PassageListItem: (props: {
    passageData: { id: number; name: string };
    onClick: () => void;
    active?: boolean;
  }) => (
    <button
      type="button"
      data-testid={`passage-${props.passageData.id}`}
      data-active={String(!!props.active)}
      onClick={() => props.onClick()}
    >
      {props.passageData.name}
    </button>
  ),
}));

import { PassageList } from './PassageList';

afterEach(() => cleanup());

describe('PassageList', () => {
  beforeEach(() => {
    createVirtualizerMock.mockReset();
    createVirtualizerMock.mockImplementation((options: { count: number }) => ({
      getTotalSize: () => options.count * 35,
      getVirtualItems: () =>
        Array.from({ length: options.count }, (_, index) => ({
          index,
          size: 35,
          start: index * 35,
        })),
    }));
  });

  it('should render title and virtualized rows', () => {
    const passages = [
      { id: 1, name: 'Intro', tags: [], content: '', size: null, position: null },
      { id: 2, name: 'Start', tags: [], content: '', size: null, position: null },
    ] as any;

    render(() => (
      <PassageList
        passages={passages}
        selectedPassage={null}
        onPassageClick={vi.fn<(...args: any[]) => any>()}
      />
    ));

    expect(screen.getByText('Passages')).toBeTruthy();
    expect(screen.getByTestId('passage-1').textContent).toBe('Intro');
    expect(screen.getByTestId('passage-2').textContent).toBe('Start');

    const opts = createVirtualizerMock.mock.calls[0]?.[0];
    expect(opts).toBeTruthy();
    expect(opts.estimateSize()).toBe(35);
    expect(opts.count).toBe(2);
    expect(opts.getScrollElement()).toBeInstanceOf(HTMLElement);
  });

  it('should call onPassageClick with selected item data', () => {
    const onPassageClick = vi.fn<(...args: any[]) => any>();
    const passages = [
      { id: 1, name: 'Intro', tags: [], content: '', size: null, position: null },
    ] as any;

    render(() => (
      <PassageList passages={passages} selectedPassage={null} onPassageClick={onPassageClick} />
    ));
    fireEvent.click(screen.getByTestId('passage-1'));

    expect(onPassageClick).toHaveBeenCalledWith(passages[0]);
  });

  it('should pass active flag for the selected passage', () => {
    const passages = [
      { id: 1, name: 'Intro', tags: [], content: '', size: null, position: null },
      { id: 2, name: 'Start', tags: [], content: '', size: null, position: null },
    ] as any;

    render(() => (
      <PassageList
        passages={passages}
        selectedPassage={passages[1]}
        onPassageClick={vi.fn<(...args: any[]) => any>()}
      />
    ));

    expect(screen.getByTestId('passage-1').getAttribute('data-active')).toBe('false');
    expect(screen.getByTestId('passage-2').getAttribute('data-active')).toBe('true');
  });

  it('should render no rows when passage list is empty', () => {
    render(() => (
      <PassageList
        passages={[]}
        selectedPassage={null}
        onPassageClick={vi.fn<(...args: any[]) => any>()}
      />
    ));

    expect(screen.queryByTestId('passage-1')).toBeNull();
  });

  it('should skip rendering row when virtual item index is out of bounds', () => {
    createVirtualizerMock.mockImplementation((options: { count: number }) => ({
      getTotalSize: () => options.count * 35,
      getVirtualItems: () => [
        { index: 0, size: 35, start: 0 },
        { index: options.count + 4, size: 35, start: 35 },
      ],
    }));

    const passages = [
      { id: 1, name: 'Intro', tags: [], content: '', size: null, position: null },
    ] as any;
    render(() => (
      <PassageList
        passages={passages}
        selectedPassage={null}
        onPassageClick={vi.fn<(...args: any[]) => any>()}
      />
    ));

    expect(screen.getByTestId('passage-1')).toBeTruthy();
    expect(screen.queryByTestId('passage-6')).toBeNull();
  });
});
