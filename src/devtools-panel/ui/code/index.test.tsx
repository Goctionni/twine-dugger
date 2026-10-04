import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { setSetting } from '@/devtools-panel/store/store';

import type * as highlighterModule from './highlighter';
import { Code, LARGE_CODE_LENGTH } from './index';

// Highlighting is not what is tested here, and it loads grammars
vi.mock('./highlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof highlighterModule>()),
  createHighlighter: () => new Promise(() => {}),
  createRegistry: () => ({}),
}));

let host: HTMLElement;
let dispose: () => void;

const mount = (code: string) => {
  dispose = render(() => <Code code={code} />, host);
  flush();
};
const banner = () => host.textContent?.includes('Enable syntax highlighting');

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  setSetting('editor.syntaxHighlighting', 'small');
  flush();
});
afterEach(() => {
  dispose();
  host.remove();
});

describe('Code syntax highlighting setting', () => {
  it('offers to turn it on for a long passage, and then stops asking', () => {
    mount('x'.repeat(LARGE_CODE_LENGTH + 1));
    expect(banner()).toBe(true);
    host.querySelector<HTMLButtonElement>('button')!.click();
    flush();
    expect(banner()).toBe(false);
  });

  it('says nothing for a short passage', () => {
    mount('short');
    expect(banner()).toBe(false);
  });

  it('says nothing when it is always or never on', () => {
    setSetting('editor.syntaxHighlighting', 'always');
    flush();
    mount('x'.repeat(LARGE_CODE_LENGTH + 1));
    expect(banner()).toBe(false);
    dispose();
    setSetting('editor.syntaxHighlighting', 'never');
    flush();
    mount('x'.repeat(LARGE_CODE_LENGTH + 1));
    expect(banner()).toBe(false);
  });
});
