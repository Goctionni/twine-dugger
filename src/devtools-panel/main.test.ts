/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const renderMock = vi.hoisted(() => vi.fn<(...args: any[]) => any>());

vi.mock('solid-js/web', () => ({
  render: renderMock,
}));

vi.mock('./app/App', () => ({
  App: () => null,
}));

describe('main bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    renderMock.mockReset();
  });

  it('should mount App into root element', async () => {
    await import('./main');

    const root = document.getElementById('root');
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock.mock.calls[0]?.[1]).toBe(root);
  });
});
