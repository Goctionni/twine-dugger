/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@tanstack/solid-virtual', () => ({
  createVirtualizer: vi.fn((options: { count: number }) => ({
    getTotalSize: () => options.count * 35,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({ index, size: 35, start: index * 35 })),
  })),
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
  it('should render title and virtualized rows', () => {
    const passages = [
      { id: 1, name: 'Intro', tags: [], content: '', size: null, position: null },
      { id: 2, name: 'Start', tags: [], content: '', size: null, position: null },
    ] as any;

    render(() => (
      <PassageList passages={passages} selectedPassage={null} onPassageClick={vi.fn()} />
    ));

    expect(screen.getByText('Passages')).toBeTruthy();
    expect(screen.getByTestId('passage-1').textContent).toBe('Intro');
    expect(screen.getByTestId('passage-2').textContent).toBe('Start');
  });

  it('should call onPassageClick with selected item data', () => {
    const onPassageClick = vi.fn();
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
      <PassageList passages={passages} selectedPassage={passages[1]} onPassageClick={vi.fn()} />
    ));

    expect(screen.getByTestId('passage-1').getAttribute('data-active')).toBe('false');
    expect(screen.getByTestId('passage-2').getAttribute('data-active')).toBe('true');
  });
});
