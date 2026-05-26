/** @jsxImportSource solid-js */
/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { classifySign, SmokePanel } from './smoke.target';

afterEach(() => {
  cleanup();
});

// Section A: pure logic smoke checks for fast deterministic mutation kills.
describe('smoke logic section', () => {
  it('should classify negative numbers', () => {
    expect(classifySign(-1)).toBe('negative');
  });

  it('should classify zero exactly', () => {
    expect(classifySign(0)).toBe('zero');
  });

  it('should classify positive numbers', () => {
    expect(classifySign(7)).toBe('positive');
  });
});

// Section B: Solid component jsdom path mirroring real component test style.
describe('smoke component section', () => {
  it('should render trimmed heading from title prop', () => {
    render(() => <SmokePanel title="  Smoke Panel  " />);

    const heading = screen.getByRole('heading', { name: 'Smoke Panel' });
    expect(heading.textContent).toBe('Smoke Panel');
  });

  it('should render smoke body content', () => {
    render(() => <SmokePanel title="Smoke Panel" />);

    expect(screen.getByText('smoke body')).toBeDefined();
  });
});
