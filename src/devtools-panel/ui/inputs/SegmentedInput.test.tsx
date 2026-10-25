import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it } from 'vite-plus/test';

import { SegmentedInput } from './SegmentedInput';

afterEach(cleanup);

const options = [
  { value: 'a', label: 'First' },
  { value: 'b', label: 'Second' },
  { value: 'c', label: 'Third' },
] as const;

it('has a radio for every option, and the one of the value is checked', () => {
  render(() => <SegmentedInput label="Choice" options={options} value="b" onChange={() => {}} />);

  expect(screen.getByRole('radiogroup', { name: 'Choice' })).toBeTruthy();
  const radios = screen.getAllByRole<HTMLInputElement>('radio');
  expect(radios.map((radio) => radio.checked)).toEqual([false, true, false]);
});

it('says which one was chosen, and follows the value it is given', () => {
  const chosen: string[] = [];
  const [getValue, setValue] = createSignal<'a' | 'b' | 'c'>('a');
  render(() => (
    <SegmentedInput
      options={options}
      value={getValue()}
      onChange={(value) => {
        chosen.push(value);
        setValue(value);
      }}
    />
  ));

  screen.getByLabelText('Third').click();
  flush();
  expect(chosen).toEqual(['c']);
  expect(screen.getByLabelText<HTMLInputElement>('Third').checked).toBe(true);
  expect(screen.getByLabelText<HTMLInputElement>('First').checked).toBe(false);
});
