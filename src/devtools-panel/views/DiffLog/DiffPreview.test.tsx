/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DiffPreview } from './DiffPreview';

afterEach(() => cleanup());

describe('DiffPreview', () => {
  it('should truncate arrays beyond preview max length', () => {
    render(() => <DiffPreview value={[1, 2, 3, 4, 5, 6] as any} />);

    expect(screen.getByText((content) => content.includes('… (1 more items)'))).toBeTruthy();
  });

  it('should render map values with map wrapper prefix', () => {
    render(() => <DiffPreview value={new Map([['hp', 10]]) as any} />);

    expect(screen.getByText(/new Map/)).toBeTruthy();
    expect(screen.getByText('hp')).toBeTruthy();
  });

  it('should render depth-limited nested object preview text', () => {
    render(() => <DiffPreview value={{ deep: { hp: 10 } } as any} />);

    expect(screen.getByText(/\[Object\(/)).toBeTruthy();
  });
});
