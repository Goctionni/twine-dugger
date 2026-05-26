/** @vitest-environment jsdom */

import { cleanup, render, waitFor } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import harloweLangDef from './grammars/harlowe-grammar.json';
import sugarcubeLangDef from './grammars/sugarcube-grammar.json';

const { createRegistryMock, createHighlighterMock, toHtmlMock } = vi.hoisted(() => ({
  createRegistryMock: vi.fn(),
  createHighlighterMock: vi.fn(),
  toHtmlMock: vi.fn(),
}));

vi.mock('./highlighter', () => ({
  createRegistry: createRegistryMock,
  createHighlighter: createHighlighterMock,
}));

import { Code } from './index';

describe('Code', () => {
  beforeEach(() => {
    createRegistryMock.mockReset();
    createHighlighterMock.mockReset();
    toHtmlMock.mockReset();

    createRegistryMock.mockReturnValue({ id: 'registry' });
    toHtmlMock.mockImplementation(
      (code: string) => `<span data-code="x">highlighted:${encodeURIComponent(code)}</span>`,
    );
    createHighlighterMock.mockResolvedValue({ toHtml: toHtmlMock });
  });

  afterEach(() => cleanup());

  it('should use SugarCube scope and render highlighted HTML', async () => {
    const { container } = render(() => <Code code="<<set $hp = 10>>" format="SugarCube" />);

    await waitFor(() => {
      const element = container.querySelector('code.passage-code');
      expect(element?.innerHTML).toContain('highlighted:%3C%3Cset%20%24hp%20%3D%2010%3E%3E');
    });

    expect(createRegistryMock).toHaveBeenCalledTimes(1);
    expect(createHighlighterMock).toHaveBeenCalledWith({
      registry: { id: 'registry' },
      scope: sugarcubeLangDef.scopeName,
    });
    expect(toHtmlMock).toHaveBeenCalledWith('<<set $hp = 10>>');
  });

  it('should default to Harlowe scope when format is missing', async () => {
    const { container } = render(() => <Code code="(set:$hp to 10)" />);

    await waitFor(() => {
      const element = container.querySelector('code.passage-code');
      expect(element?.innerHTML).toContain('highlighted:(set%3A%24hp%20to%2010)');
    });

    expect(createHighlighterMock).toHaveBeenCalledWith({
      registry: { id: 'registry' },
      scope: harloweLangDef.scopeName,
    });
  });
});
