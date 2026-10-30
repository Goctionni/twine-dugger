import { cleanup, render, screen } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, onTestFinished } from 'vite-plus/test';

import { getSettings, setSetting } from '@/devtools-panel/store/store';

import { TreeLayoutChoice } from './TreeLayoutChoice';

afterEach(cleanup);

it('shows the two layouts, with the chosen one checked, and changes the setting when the other is chosen', () => {
  onTestFinished(() => setSetting('state.treeLayout', 'containers-and-primitives'));
  render(() => <TreeLayoutChoice />);

  const everything = screen.getByLabelText<HTMLInputElement>(/Everything in the tree/);
  const list = screen.getByLabelText<HTMLInputElement>(/Containers, and a list/);
  expect(everything.checked).toBe(true);
  expect(list.checked).toBe(false);

  list.click();
  flush();
  expect(getSettings.state.treeLayout()).toBe('primitives-in-list');
  expect(list.checked).toBe(true);
});
