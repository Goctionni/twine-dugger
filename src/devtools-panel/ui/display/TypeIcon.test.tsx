/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TypeIcon } from './TypeIcon';

afterEach(() => cleanup());

describe('TypeIcon', () => {
  it('should render function icon', () => {
    render(() => <TypeIcon type="function" />);
    expect(screen.getByTitle('function').textContent).toBe('ƒ');
  });

  it('should render object and number icons', () => {
    render(() => <TypeIcon type="object" />);
    expect(screen.getByTitle('object').textContent).toBe('{}');

    cleanup();
    render(() => <TypeIcon type="number" />);
    expect(screen.getByTitle('number').textContent).toBe('#');
  });

  it('should render undefined icon marker', () => {
    render(() => <TypeIcon type="undefined" />);
    expect(screen.getByTitle('undefined').textContent).toBe('?');
  });
});
