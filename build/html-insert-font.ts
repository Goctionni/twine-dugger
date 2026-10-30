import { resolve } from 'path';

import { type Plugin } from 'vite-plus';

import { createFreshModule } from './fresh-module.ts';
import { getFontHtml } from './material-symbols.ts';

export const iconNames = [
  'abc',
  'account_tree',
  'add',
  'arrow_downward',
  'arrow_upward',
  'asterisk',
  'block',
  'category',
  'check',
  'chevron_right',
  'close',
  'content_copy',
  'data_object',
  'delete',
  'expand_more',
  'filter_alt',
  'grid_view',
  'history',
  'lock',
  'lock_open',
  'open_in_browser',
  'refresh',
  'save',
  'search',
  'settings',
  'sort',
  'splitscreen_left',
  'star',
  'swap_vert',
  'view_column',
  'warning',
];

// In watch mode the icons, and the way the font is asked for, can change between builds
const getIcons = createFreshModule(resolve(import.meta.dirname, 'html-insert-font.ts'), {
  iconNames,
});
const getFont = createFreshModule(resolve(import.meta.dirname, 'material-symbols.ts'), {
  getFontHtml,
});

export const htmlInsertFontPlugin: Plugin = {
  name: 'html-insert-font',
  async transformIndexHtml(html) {
    const { iconNames } = await getIcons();
    const { getFontHtml } = await getFont();
    return html.replace('<!--head-->', await getFontHtml(iconNames));
  },
};
