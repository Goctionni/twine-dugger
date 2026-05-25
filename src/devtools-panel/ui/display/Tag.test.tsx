/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tag } from './Tag';

afterEach(() => cleanup());

describe('Tag', () => {
  it('should render tag label text', () => {
    render(() => <Tag tag="alpha" />);
    expect(screen.getByText('alpha')).toBeTruthy();
  });

  it('should derive same background color for case-insensitive values', () => {
    const { container } = render(() => (
      <div>
        <Tag tag="Alpha" />
        <Tag tag="alpha" />
      </div>
    ));

    const spans = container.querySelectorAll('span');
    const first = spans[0]?.getAttribute('style');
    const second = spans[1]?.getAttribute('style');
    expect(first).toBeDefined();
    expect(first).toBe(second);
  });
});
