import { type Plugin } from 'vite-plus';

import { getFontHtml } from './material-symbols.ts';

export const htmlInsertFontPlugin: Plugin = {
  name: 'html-insert-font',
  async transformIndexHtml(html) {
    return html.replace(
      '<!--head-->',
      await getFontHtml([
        'search',
        'data_object',
        'settings',
        'content_copy',
        'close',
        'open_in_browser',
        'warning',
        'refresh',
      ]),
    );
  },
};
