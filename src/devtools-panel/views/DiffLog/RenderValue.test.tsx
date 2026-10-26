import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, expect, it } from 'vite-plus/test';

import { TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { DiffPreview } from './DiffPreview';
import { RenderValue } from './RenderValue';

afterEach(cleanup);

const date = `${TYPE_KEY}: Date 2020-01-02T03:04:05` as JSONSafeValue;
const fn = { [TYPE_KEY]: 'function', str: '() => 1' } as JSONSafeValue;

it('shows a Date as the time it stands for', () => {
  const { container } = render(() => <RenderValue value={date} />);
  expect(container.textContent).toBe('2020-01-02 03:04:05');
});

it('shows a function without crashing', () => {
  const { container } = render(() => <RenderValue value={fn} />);
  expect(container.textContent).toContain('function');
});

it('previews an object and an array that hold a Date and a function', () => {
  const { container } = render(() => (
    <DiffPreview value={{ when: date, run: fn, list: [date, fn] } as JSONSafeValue} />
  ));
  expect(container.textContent).toContain('when');
  expect(container.textContent).toContain('2020-01-02 03:04:05');
  expect(container.textContent).toContain('function');
});

it('says so when a Date is not a time', () => {
  const invalid = `${TYPE_KEY}: Date Invalid` as JSONSafeValue;
  const { container } = render(() => <RenderValue value={invalid} />);
  expect(container.textContent).toBe('Invalid Date');
});
