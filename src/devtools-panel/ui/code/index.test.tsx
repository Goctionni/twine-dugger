import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { setSetting } from '@/devtools-panel/store/store';
import { getMarkedText, installFakeHighlights } from '@/devtools-panel/ui/util/test-highlights';

import type * as highlighterModule from './highlighter';
import { getHighlightingLength } from './highlighting-limits';
import { Code } from './index';

// Highlighting is not what is tested here, and it loads grammars
vi.mock('./highlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof highlighterModule>()),
  createHighlighter: () => new Promise(() => {}),
  createRegistry: () => ({}),
}));

let host: HTMLElement;
let dispose: () => void;

const mount = (length: number) => {
  dispose = render(() => <Code code={'x'.repeat(length)} />, host);
  flush();
};
const banner = () => host.textContent?.includes('Enable syntax highlighting');

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  dispose();
  host.remove();
});

describe('Code: disable immediate syntax highlighting', () => {
  it('holds highlighting back from the length of the setting on, and offers to turn it on', () => {
    setSetting('editor.disableHighlighting', 'large');
    flush();
    mount(getHighlightingLength('large'));
    expect(banner()).toBe(true);
    host.querySelector<HTMLButtonElement>('button')!.click();
    flush();
    expect(banner()).toBe(false);
  });

  it('highlights a passage that is shorter than the setting', () => {
    setSetting('editor.disableHighlighting', 'large');
    flush();
    mount(getHighlightingLength('large') - 1);
    expect(banner()).toBe(false);
  });

  it('follows the length of the setting', () => {
    setSetting('editor.disableHighlighting', 'normal');
    flush();
    mount(getHighlightingLength('normal'));
    expect(banner()).toBe(true);
    dispose();
    setSetting('editor.disableHighlighting', 'very-large');
    flush();
    mount(getHighlightingLength('normal'));
    expect(banner()).toBe(false);
  });

  it('never holds it back for never, and always does for always', () => {
    setSetting('editor.disableHighlighting', 'never');
    flush();
    mount(1_000_000);
    expect(banner()).toBe(false);
    dispose();
    setSetting('editor.disableHighlighting', 'always');
    flush();
    mount(1);
    expect(banner()).toBe(true);
  });
});

describe('Code: matches', () => {
  it('marks the matches it is given, and not once the text is edited', () => {
    installFakeHighlights();
    setSetting('editor.disableHighlighting', 'never');
    flush();
    dispose = render(
      () => (
        <Code
          code="one two one"
          matches={[
            [0, 3],
            [8, 11],
          ]}
        />
      ),
      host,
    );
    flush();
    expect(getMarkedText()).toEqual(['one', 'one']);

    const textarea = host.querySelector('textarea')!;
    textarea.value = 'one two';
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    flush();
    expect(getMarkedText()).toEqual([]);
  });
});
