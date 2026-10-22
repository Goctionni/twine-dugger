import { cleanup, render, screen } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it } from 'vite-plus/test';

import { PromptDialogOutlet } from '@/devtools-panel/ui/util/Prompt';
import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';

import type { NewType } from './add-property';
import { showAddDialog } from './AddPropertyDialog';

// jsdom does not open a dialog with showModal
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
  this.removeAttribute('open');
};

afterEach(cleanup);

function setup(target: 'object' | 'map' | 'array', defaultType?: NewType) {
  // The dialog is in a portal, outside the container of the render: the queries are of the page
  render(() => <PromptDialogOutlet />);
  const view = screen;
  const result = showAddDialog({ target, existingKeys: ['taken'], defaultType });
  flush();

  const type = () => view.getByRole<HTMLSelectElement>('combobox', { name: 'Type' });
  const name = () => view.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
  const addButton = () => view.getByRole<HTMLButtonElement>('button', { name: 'Add' });
  const jsonBox = () => view.getByRole<HTMLInputElement>('checkbox', { name: 'Edit as JSON' });
  const jsonText = () => view.getByRole<HTMLTextAreaElement>('textbox', { name: 'JSON' });
  const input = (field: HTMLInputElement | HTMLTextAreaElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  // The icon of a type is part of the name of its button
  const choose = (kind: string) => {
    view.getByRole('button', { name: new RegExp(kind + '$', 'i') }).click();
    flush();
  };
  const check = (box: HTMLInputElement) => {
    box.click();
    flush();
  };
  return { ...view, result, type, name, addButton, jsonBox, jsonText, input, choose, check };
}

it('starts by asking for the type, with a button for each', () => {
  const { getAllByRole, queryByRole } = setup('object');
  const labels = getAllByRole('button').map((button) => button.textContent!.trim());
  for (const type of ['string', 'number', 'boolean', 'object', 'map', 'array', 'set']) {
    expect(labels.filter((label) => label.endsWith(type))).toHaveLength(1);
  }
  expect(queryByRole('combobox')).toBeNull();
  // The dialog can be closed with its own button
  expect(queryByRole('button', { name: 'Cancel' })).toBeNull();
});

it('goes to the form when a type is chosen, with the type in a menu', () => {
  const { choose, type, name } = setup('object');
  choose('number');
  expect(type().value).toBe('number');
  expect(name()).toBeTruthy();
});

it('skips the first step when the children are all of one type', () => {
  const { type, queryByRole } = setup('object', 'boolean');
  expect(type().value).toBe('boolean');
  expect(queryByRole('button', { name: /string$/i })).toBeNull();
});

it('adds a string at a name', async () => {
  const { choose, name, input, addButton, getByRole, result } = setup('object');
  choose('string');
  expect(addButton().disabled).toBe(true);

  input(name(), 'title');
  input(getByRole<HTMLInputElement>('textbox', { name: 'Value' }), 'Ada');
  expect(addButton().disabled).toBe(false);
  addButton().click();
  expect(await result).toEqual({ name: 'title', value: 'Ada' });
});

it('says what is wrong with a name, once it was typed', () => {
  const { choose, name, input, addButton, getByText, queryByText } = setup('map');
  choose('number');
  expect(queryByText('A name is needed')).toBeNull();

  input(name(), 'taken');
  expect(getByText('taken already exists')).toBeTruthy();
  expect(addButton().disabled).toBe(true);

  input(name(), 'free');
  expect(addButton().disabled).toBe(false);
});

it('asks for no name for the item of an array', async () => {
  const { choose, queryByRole, addButton, result, getByRole } = setup('array');
  choose('number');
  expect(queryByRole('textbox', { name: 'Name' })).toBeNull();

  const field = getByRole<HTMLInputElement>('spinbutton');
  field.value = '7';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  flush();
  addButton().click();
  expect(await result).toEqual({ name: undefined, value: 7 });
});

it('adds the number and the boolean it starts from', async () => {
  const number = setup('array', 'number');
  number.addButton().click();
  expect(await number.result).toEqual({ name: undefined, value: 0 });
  cleanup();

  const boolean = setup('array', 'boolean');
  boolean.addButton().click();
  expect(await boolean.result).toEqual({ name: undefined, value: false });
});

it('adds containers empty, a map and a set with their marker', async () => {
  const map = setup('object');
  map.choose('map');
  map.input(map.name(), 'm');
  map.addButton().click();
  expect(await map.result).toEqual({ name: 'm', value: { [TYPE_KEY]: 'Map' } });
  cleanup();

  const set = setup('array', 'set');
  set.addButton().click();
  expect(await set.result).toEqual({ name: undefined, value: [SET_MARKER] });
});

it('has a larger field for a string when Multiline is checked, and keeps what was typed', () => {
  const { choose, getByRole, check, input } = setup('array');
  choose('string');
  input(getByRole<HTMLInputElement>('textbox', { name: 'Value' }), 'one');
  check(getByRole<HTMLInputElement>('checkbox', { name: 'Multiline' }));
  const area = getByRole<HTMLTextAreaElement>('textbox', { name: 'Value' });
  expect(area.tagName).toBe('TEXTAREA');
  expect(area.value).toBe('one');
});

it('edits as JSON: the value of the type as text, which has to stay a value of the type', async () => {
  const { choose, name, input, check, jsonBox, jsonText, addButton, getByText, result } =
    setup('object');
  choose('object');
  input(name(), 'o');
  check(jsonBox());
  expect(jsonText().value).toBe('{}');

  input(jsonText(), '[1]');
  expect(getByText('Expected an object')).toBeTruthy();
  expect(addButton().disabled).toBe(true);

  input(jsonText(), '{"a": [1, 2]}');
  addButton().click();
  expect(await result).toEqual({ name: 'o', value: { a: [1, 2] } });
});

it('shows a map as an object with its marker in the JSON', () => {
  const { choose, name, input, check, jsonBox, jsonText } = setup('object');
  choose('map');
  input(name(), 'm');
  check(jsonBox());
  expect(JSON.parse(jsonText().value)).toEqual({ [TYPE_KEY]: 'Map' });
});

it('keeps a primitive that was typed as JSON when the checkbox is unchecked', async () => {
  const { choose, check, jsonBox, jsonText, input, addButton, getByRole, result } = setup('array');
  choose('number');
  check(jsonBox());
  expect(jsonText().value).toBe('0');
  input(jsonText(), '42');
  check(jsonBox());
  expect(getByRole<HTMLInputElement>('spinbutton').value).toBe('42');
  addButton().click();
  expect(await result).toEqual({ name: undefined, value: 42 });
});

it('starts a new value when the type is changed, and keeps the name', () => {
  const { choose, name, input, type, getByRole } = setup('object');
  choose('string');
  input(name(), 'keep');
  input(getByRole<HTMLInputElement>('textbox', { name: 'Value' }), 'text');

  type().value = 'number';
  type().dispatchEvent(new Event('change', { bubbles: true }));
  flush();
  expect(name().value).toBe('keep');
  expect(getByRole<HTMLInputElement>('spinbutton').value).toBe('0');
});

it('resolves with nothing when it is cancelled', async () => {
  const { choose, getByRole, result } = setup('object');
  choose('string');
  getByRole('button', { name: 'Cancel' }).click();
  expect(await result).toBeUndefined();
});
