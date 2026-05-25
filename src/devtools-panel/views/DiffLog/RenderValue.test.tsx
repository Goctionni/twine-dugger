/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { RenderValue } from './RenderValue';

afterEach(() => cleanup());

describe('RenderValue', () => {
  it('should render empty string marker', () => {
    render(() => <RenderValue value="" />);
    expect(screen.getByText('""')).toBeTruthy();
  });

  it('should render number and boolean primitives with literal values', () => {
    render(() => <RenderValue value={42} />);
    expect(screen.getByText('42')).toBeTruthy();

    cleanup();
    render(() => <RenderValue value={false} />);
    expect(screen.getByText('false')).toBeTruthy();
  });

  it('should render object fallback with tooltip preview affordance', () => {
    render(() => <RenderValue value={{ hp: 10 }} faded />);

    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(screen.getByText('object')).toBeTruthy();
    expect(screen.getByText('search')).toBeTruthy();
  });
});
