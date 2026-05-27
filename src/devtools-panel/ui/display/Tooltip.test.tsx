/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from './Tooltip';

afterEach(() => cleanup());

describe('Tooltip', () => {
  it('should render anchor element with generated target linkage', () => {
    render(() => (
      <Tooltip
        area="bottom right"
        element={(anchorProps) => <button {...anchorProps}>anchor</button>}
        tooltip={<span>help</span>}
      />
    ));

    const anchor = screen.getByRole('button', { name: 'anchor' });
    const tooltip = screen.getByRole('tooltip');

    const anchorId = anchor.getAttribute('data-anchor');
    expect(anchor.className.includes('tp-anchor')).toBe(true);
    expect(anchorId?.startsWith('--a-')).toBe(true);
    expect(tooltip.getAttribute('data-anchor-target')).toBe(anchorId);
    expect(tooltip.getAttribute('data-area')).toBe('bottom right');
    expect(tooltip.textContent).toBe('help');
  });
});
