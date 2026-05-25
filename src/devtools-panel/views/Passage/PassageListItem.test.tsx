/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/devtools-panel/ui/display/Tag', () => ({
  Tag: (props: { tag: string }) => <span data-testid="tag">{props.tag}</span>,
}));

import { PassageListItem } from './PassageListItem';

afterEach(() => cleanup());

describe('PassageListItem', () => {
  it('should render passage name and tags', () => {
    render(() => (
      <PassageListItem
        passageData={{
          id: 1,
          name: 'Intro',
          tags: ['a', 'b'],
          content: '',
          size: null,
          position: null,
        }}
        onClick={vi.fn()}
      />
    ));

    expect(screen.getByText('Intro')).toBeTruthy();
    expect(screen.getAllByTestId('tag').map((n) => n.textContent)).toEqual(['a', 'b']);
  });

  it('should call click handler when row is pressed', () => {
    const onClick = vi.fn();

    render(() => (
      <PassageListItem
        passageData={{ id: 1, name: 'Intro', tags: [], content: '', size: null, position: null }}
        onClick={onClick}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Intro' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should apply active class when item is selected', () => {
    const { container } = render(() => (
      <PassageListItem
        passageData={{ id: 1, name: 'Intro', tags: [], content: '', size: null, position: null }}
        onClick={vi.fn()}
        active
      />
    ));

    const button = container.querySelector('button');
    expect(button?.className.includes('bg-slate-700')).toBe(true);
  });
});
