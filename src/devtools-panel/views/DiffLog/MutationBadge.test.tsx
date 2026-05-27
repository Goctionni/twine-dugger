/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { MutationBadge } from './MutationBadge';

describe('MutationBadge', () => {
  afterEach(() => cleanup());

  it('should render ADD badge with expected style classes', () => {
    render(() => <MutationBadge kind="add" />);

    const badge = screen.getByText('ADD');
    expect(badge.className.includes('bg-emerald-900/40')).toBe(true);
    expect(badge.className.includes('text-emerald-200')).toBe(true);
    expect(badge.className.includes('border-emerald-700/60')).toBe(true);
  });

  it('should render expected label for each mutation kind', () => {
    render(() => <MutationBadge kind="del" />);
    expect(screen.getByText('DEL')).toBeTruthy();
    cleanup();

    render(() => <MutationBadge kind="chg" />);
    expect(screen.getByText('CHG')).toBeTruthy();
    cleanup();

    render(() => <MutationBadge kind="typ" />);
    expect(screen.getByText('TYPE')).toBeTruthy();
    cleanup();

    render(() => <MutationBadge kind="mov" />);
    expect(screen.getByText('MOVE')).toBeTruthy();
  });
});
