import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, expect, it } from 'vite-plus/test';

import { FilterPropertiesDialog } from './FilterPropertiesDialog';

afterEach(() => cleanup());

it('has an option for every type of property that can be hidden, dates included', () => {
  render(() => <FilterPropertiesDialog filters={[]} onConfirm={() => {}} />);
  for (const label of ['Map', 'Object', 'Set', 'Array', 'String', 'Number', 'Boolean', 'Date']) {
    expect(screen.getByText(label)).toBeTruthy();
  }
});
