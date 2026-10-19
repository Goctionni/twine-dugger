import { expect, it } from 'vite-plus/test';

import { addToNumber, getSteppedNumber } from './step-number';

function stepFrom(text: string, key: string, init: KeyboardEventInit = {}) {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = text;
  let result: number | undefined;
  input.addEventListener('keydown', (event) => (result = getSteppedNumber(event)));
  input.dispatchEvent(new KeyboardEvent('keydown', { key, ...init }));
  return result;
}

it('adds 1 with the arrow keys, 10 with Shift, and multiplies by 10 with Ctrl', () => {
  expect(stepFrom('5', 'ArrowUp')).toBe(6);
  expect(stepFrom('5', 'ArrowDown')).toBe(4);
  expect(stepFrom('5', 'ArrowUp', { shiftKey: true })).toBe(15);
  expect(stepFrom('5', 'ArrowDown', { shiftKey: true })).toBe(-5);
  expect(stepFrom('5', 'ArrowUp', { ctrlKey: true })).toBe(50);
  expect(stepFrom('5', 'ArrowDown', { ctrlKey: true })).toBe(0.5);
  expect(stepFrom('0.3', 'ArrowUp', { ctrlKey: true })).toBe(3);
});

it('counts an empty field as 0, and ignores other keys', () => {
  expect(stepFrom('', 'ArrowUp')).toBe(1);
  expect(stepFrom('5', 'a')).toBeUndefined();
  expect(stepFrom('5', 'ArrowUp', { altKey: true })).toBeUndefined();
  expect(stepFrom('5', 'ArrowUp', { ctrlKey: true, shiftKey: true })).toBeUndefined();
});

it('adds without the tail of floating point', () => {
  expect(addToNumber(0.1, 0.2)).toBe(0.3);
});
