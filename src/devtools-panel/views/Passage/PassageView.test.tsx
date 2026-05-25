/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/devtools-panel/ui/code', () => ({
  Code: (props: { code: string; format: string }) => (
    <div data-testid="code">
      {props.format}:{props.code}
    </div>
  ),
}));

vi.mock('./PassageHeader', () => ({
  PassageHeader: (props: { passage: { name: string } }) => (
    <div data-testid="header">{props.passage.name}</div>
  ),
}));

import { PassageView } from './PassageView';

afterEach(() => cleanup());

describe('PassageView', () => {
  it('should render empty fallback when no passage selected', () => {
    render(() => <PassageView passage={null} language="SugarCube" />);
    expect(screen.getByText('No passage selected.')).toBeTruthy();
  });

  it('should render header and code for selected passage', () => {
    render(() => (
      <PassageView
        language="SugarCube"
        passage={{ id: 1, name: 'Start', tags: [], content: 'Body', size: null, position: null }}
      />
    ));

    expect(screen.getByTestId('header').textContent).toBe('Start');
    expect(screen.getByTestId('code').textContent).toBe('SugarCube:Body');
  });
});
