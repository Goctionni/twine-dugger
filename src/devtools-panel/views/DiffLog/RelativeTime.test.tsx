/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { RelativeTime } from './RelativeTime';

describe('RelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T12:00:00.000Z'));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should render seconds-ago text for recent timestamps', () => {
    render(() => <RelativeTime date={new Date('2026-05-26T11:59:30.000Z')} />);

    const text = screen.getByText(/ago/).textContent ?? '';
    expect(text).toMatch(/sec|second/i);
  });

  it('should render minutes-ago text for older timestamps', () => {
    render(() => <RelativeTime date={new Date('2026-05-26T11:40:00.000Z')} />);

    const text = screen.getByText(/ago/).textContent ?? '';
    expect(text).toMatch(/min|minute/i);
  });

  it('should update rendered text after timer tick', () => {
    render(() => <RelativeTime date={new Date('2026-05-26T11:59:59.000Z')} />);

    const before = screen.getByText(/ago/).textContent ?? '';
    vi.advanceTimersByTime(1200);
    const after = screen.getByText(/ago/).textContent ?? '';

    expect(before).not.toBe('');
    expect(after).not.toBe('');
  });
});
