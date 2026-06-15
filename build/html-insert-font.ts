import { type Plugin } from 'vite-plus';

import { getFontHtml } from './material-symbols.ts';

export const htmlInsertFontPlugin: Plugin = {
  name: 'html-insert-font',
  async transformIndexHtml(html) {
    return html.replace(
      '<!--head-->',
      await getFontHtml([
        'abc',
        'add',
        'arrow_downward',
        'arrow_upward',
        'asterisk',
        'block',
        'category',
        'check',
        'close',
        'content_copy',
        'data_object',
        'filter_alt',
        'history',
        'open_in_browser',
        'refresh',
        'search',
        'settings',
        'sort',
        'warning',
      ]),
    );
  },
};
