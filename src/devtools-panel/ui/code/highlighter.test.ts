import { describe, expect, it, vi } from 'vite-plus/test';

import { createHighlighter, createRegistry } from './highlighter';

describe('highlighter', () => {
  it('should create registry that loads grammar by scope name', async () => {
    const grammarA = { scopeName: 'source.a' } as never;
    const grammarB = { scopeName: 'source.b' } as never;
    const registry = createRegistry([grammarA, grammarB]);
    const loaded = await registry.loadGrammar('source.b');

    expect(loaded).toBeTruthy();
    expect((loaded as any)._rootScopeName).toBe('source.b');
    await expect(registry.loadGrammar('source.missing')).rejects.toThrow(
      'No grammar provided for <source.missing>',
    );
  });

  it('should convert tokenized lines into escaped HTML spans', async () => {
    const tokenizeLine = vi
      .fn<(...args: any[]) => any>()
      .mockReturnValueOnce({
        tokens: [
          { startIndex: 0, endIndex: 4, scopes: ['scope.tag'] },
          { startIndex: 4, endIndex: 8, scopes: [] },
        ],
        ruleStack: { id: 1 },
      })
      .mockReturnValueOnce({
        tokens: [{ startIndex: 0, endIndex: 6, scopes: ['scope.text'] }],
        ruleStack: null,
      });

    const highlighter = await createHighlighter({
      scope: 'source.test',
      registry: {
        loadGrammar: vi.fn<(...args: any[]) => any>().mockResolvedValue({ tokenizeLine }),
      } as never,
    });

    const html = highlighter.toHtml('<tag>raw\nline2&');

    expect(html.includes('<span class="scope.tag">&lt;tag</span>')).toBe(true);
    expect(html.includes('&gt;raw')).toBe(true);
    expect(html.includes('<span class="scope.text">line2&amp;</span>')).toBe(true);
    expect(tokenizeLine).toHaveBeenNthCalledWith(1, '<tag>raw', null);
    expect(tokenizeLine).toHaveBeenNthCalledWith(2, 'line2&', { id: 1 });
  });

  it('should throw when requested grammar is unavailable', async () => {
    await expect(
      createHighlighter({
        scope: 'source.missing',
        registry: {
          loadGrammar: vi.fn<(...args: any[]) => any>().mockResolvedValue(undefined),
        } as never,
      }),
    ).rejects.toThrow('Failed to load grammar');
  });
});
