import { expect, it } from 'vite-plus/test';

import { handleJsonTextKey } from './textarea-editing';

/** A textarea with the text, the caret (or the selection marked by [ and ]) and a key pressed in it */
function press(textWithCaret: string, key: string, init: KeyboardEventInit = {}) {
  const area = document.createElement('textarea');
  const start = textWithCaret.indexOf('|');
  const selectionStart = textWithCaret.indexOf('<');
  const hasSelection = selectionStart >= 0;
  const selectionEnd = textWithCaret.indexOf('>');
  area.value = textWithCaret.replace(/[|<>]/g, '');
  if (hasSelection) area.setSelectionRange(selectionStart, selectionEnd - 1);
  else area.setSelectionRange(start, start);

  let handled: boolean | undefined;
  let prevented = false;
  area.addEventListener('keydown', (event) => {
    handled = handleJsonTextKey(event as KeyboardEvent & { currentTarget: HTMLTextAreaElement });
    prevented = event.defaultPrevented;
  });
  area.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, ...init }));

  const { value, selectionStart: from, selectionEnd: to } = area;
  const shown = from === to ? `${value.slice(0, from)}|${value.slice(from)}` : value;
  return { handled, prevented, value, shown, selection: [from, to] };
}

it('indents the line at the caret with two spaces, wherever the caret is in it', () => {
  expect(press('a|b', 'Tab').shown).toBe('a  |b');
  expect(press('x\n"a": 1|', 'Tab').shown).toBe('x\n"a": 1  |');
});

it('indents the lines of a selection, and keeps them selected', () => {
  const result = press('<a\nb>\nc', 'Tab');
  expect(result.value).toBe('  a\n  b\nc');
  expect(result.selection).toEqual([0, 7]);
});

it('leaves the line after a selection that ends at a line break alone', () => {
  expect(press('<a\n>b', 'Tab').value).toBe('  a\nb');
});

it('takes the indentation back with Shift+Tab, one level at most, and moves the caret with it', () => {
  expect(press('    a|', 'Tab', { shiftKey: true }).shown).toBe('  a|');
  expect(press(' a|', 'Tab', { shiftKey: true }).shown).toBe('a|');
  expect(press('a|', 'Tab', { shiftKey: true }).shown).toBe('a|');
  expect(press('<  a\n  b>', 'Tab', { shiftKey: true }).value).toBe('a\nb');
});

it('starts a new line like the one before it', () => {
  expect(press('  "a": 1|', 'Enter').shown).toBe('  "a": 1\n  |');
  expect(press('x|y', 'Enter').shown).toBe('x\n|y');
});

it('goes further in after a { or [, and puts a closing bracket on a line of its own', () => {
  expect(press('{|', 'Enter').shown).toBe('{\n  |');
  expect(press('  "a": [|', 'Enter').shown).toBe('  "a": [\n    |');
  expect(press('{|}', 'Enter').value).toBe('{\n  \n}');
  expect(press('{|}', 'Enter').shown).toBe('{\n  |\n}');
});

it('leaves Shift+Enter for a plain line break', () => {
  const result = press('a|', 'Enter', { shiftKey: true });
  expect(result.handled).toBe(false);
  expect(result.prevented).toBe(false);
  expect(result.value).toBe('a');
});

it('takes a } or ] that starts a line one level back', () => {
  expect(press('{\n  "a": 1\n    |', '}').shown).toBe('{\n  "a": 1\n  }|');
  expect(press('[\n  |', ']').shown).toBe('[\n]|');
});

it('leaves a bracket alone when something is before it in the line', () => {
  const result = press('{ "a": [1, 2|', ']');
  expect(result.handled).toBe(false);
  expect(result.prevented).toBe(false);
});

it('says it handled the key, and stops the browser from doing it', () => {
  const result = press('a|', 'Tab');
  expect(result.handled).toBe(true);
  expect(result.prevented).toBe(true);
});

it('does nothing with a modifier held, or while a composition is going on', () => {
  for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
    const result = press('a|', 'Tab', init);
    expect(result.handled).toBe(false);
    expect(result.value).toBe('a');
  }
  expect(press('a|', 'Enter', { isComposing: true } as KeyboardEventInit).handled).toBe(false);
});

it('does nothing for the other keys', () => {
  expect(press('a|', 'x').handled).toBe(false);
  expect(press('a|', 'Escape').handled).toBe(false);
});
