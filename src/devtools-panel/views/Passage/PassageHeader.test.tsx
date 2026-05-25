/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/devtools-panel/ui/display/Tag', () => ({
  Tag: (props: { tag: string }) => <span data-testid="tag">{props.tag}</span>,
}));

import { PassageHeader } from './PassageHeader';

afterEach(() => cleanup());

describe('PassageHeader', () => {
  it('should render selected passage title and tags', () => {
    render(() => (
      <PassageHeader
        passage={{
          id: 1,
          name: 'Start',
          tags: ['intro', 'safe'],
          content: '',
          size: null,
          position: null,
        }}
      />
    ));

    expect(screen.getByText('Selected Passage: Start')).toBeTruthy();
    expect(screen.getAllByTestId('tag').map((n) => n.textContent)).toEqual(['intro', 'safe']);
  });
});
