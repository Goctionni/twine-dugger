import { flush } from 'solid-js';
import { describe, expect, it } from 'vite-plus/test';

import { createSelection } from './selection';

describe('createSelection', () => {
  it('marks one result as selected, and only that one', () => {
    const selection = createSelection();
    selection.select({ section: 'passage', key: 1 });
    flush();
    expect(selection.isSelected('passage', 1)).toBe(true);
    expect(selection.isSelected('passage', 2)).toBe(false);
    expect(selection.isSelected('state', 1)).toBe(false);

    selection.select({ section: 'passage', key: 2 });
    flush();
    expect(selection.isSelected('passage', 1)).toBe(false);
    expect(selection.isSelected('passage', 2)).toBe(true);

    selection.select(null);
    flush();
    expect(selection.isSelected('passage', 2)).toBe(false);
    expect(selection.selected()).toBeNull();
  });
});
