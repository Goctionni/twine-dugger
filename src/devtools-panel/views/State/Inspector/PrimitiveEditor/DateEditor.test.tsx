import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, getLock, setPathLock } from '@/devtools-panel/store/locks';
import { TYPE_KEY } from '@/shared/json-safe';
import { createGame } from '@/testing/test-game';

import { DateEditor } from './DateEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setState).mockClear();
});

const marker = (time: string) => `${TYPE_KEY}: Date ${time}`;

function setup({ compact = false } = {}) {
  const game = createGame({ when: new Date(2020, 0, 2, 3, 4, 5), group: { a: 1 } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <DateEditor path={['when']} label="when" compact={compact} />);
  const field = () => view.getByRole<HTMLInputElement>('textbox');
  const lockButton = () => view.queryByRole('button', { name: 'Lock' });
  const saveButton = () => view.queryByRole<HTMLButtonElement>('button', { name: 'Save' });

  const type = (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  const press = (key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    field().dispatchEvent(event);
    flush();
    return event;
  };
  const caretAt = (position: number) => field().setSelectionRange(position, position);
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  return {
    ...view,
    field,
    lockButton,
    saveButton,
    type,
    press,
    caretAt,
    play,
  };
}

it('shows the date as the text to type, with a lock button', () => {
  const { field, lockButton, saveButton } = setup();
  expect(field().value).toBe('2020-01-02 03:04:05');
  expect(lockButton()).not.toBeNull();
  expect(saveButton()).toBeNull();
});

it('saves a new date as the marker, with the save button and with Enter', () => {
  const { type, saveButton, press } = setup();
  type('2021-05-06 07:08:09');
  expect(saveButton()).not.toBeNull();

  saveButton()!.click();
  expect(setState).toHaveBeenLastCalledWith(['when'], marker('2021-05-06T07:08:09'));

  press('Enter');
  expect(setState).toHaveBeenCalledTimes(2);
});

it('says what is wrong with the text, and does not save it', () => {
  const { type, saveButton, press, field, queryByText } = setup();
  expect(queryByText(/Write it as/)).toBeNull();

  type('tomorrow');
  expect(
    queryByText('Write it as year-month-day hours:minutes:seconds, like 2020-01-02 03:04:05'),
  ).not.toBeNull();
  expect(field().getAttribute('aria-invalid')).toBe('true');
  expect(saveButton()!.disabled).toBe(true);
  press('Enter');
  expect(setState).not.toHaveBeenCalled();

  type('2020-02-30 03:04:05');
  expect(queryByText('2020-02 has no day 30')).not.toBeNull();

  type('2021-05-06 07:08:09');
  expect(queryByText('2020-02 has no day 30')).toBeNull();
  expect(field().getAttribute('aria-invalid')).toBeNull();
  expect(saveButton()!.disabled).toBe(false);
});

it('takes the change back with Esc', () => {
  const { field, type, press, saveButton, lockButton } = setup();
  type('nonsense');
  press('Escape');
  expect(field().value).toBe('2020-01-02 03:04:05');
  expect(saveButton()).toBeNull();
  expect(lockButton()).not.toBeNull();
});

it('is done when the game has the date', () => {
  const { field, type, press, saveButton, play } = setup();
  type('2021-05-06 07:08:09');
  press('Enter');
  expect(saveButton()).not.toBeNull();

  play((live) => (live.when = new Date(2021, 4, 6, 7, 8, 9)));
  expect(field().value).toBe('2021-05-06 07:08:09');
  expect(saveButton()).toBeNull();
});

it('follows the game when the date changes and nothing was typed', () => {
  const { field, play } = setup();
  play((live) => (live.when = new Date(2030, 11, 31, 23, 59, 59)));
  expect(field().value).toBe('2030-12-31 23:59:59');
});

it('locks the date as it is, and holds the field while it is locked', async () => {
  const { lockButton, field } = setup();
  lockButton()!.click();
  await vi.waitFor(() => expect(getLock(['when'])?.value).toBe(marker('2020-01-02T03:04:05')));
  flush();

  expect(field().readOnly).toBe(true);
});

it('shows a date that is locked as locked', async () => {
  setup();
  cleanup();
  await setPathLock(['when'], true);
  const { lockButton, field } = setup();
  expect(field().readOnly).toBe(true);
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('true');
});

it('says the date that is not a time is invalid, and lets it be set to one', () => {
  const view = setup();
  view.play((live) => (live.when = new Date(Number.NaN)));
  expect(view.field().value).toBe('Invalid Date');
  // What is not typed is not judged
  expect(view.queryByText(/Write it as/)).toBeNull();

  view.type('2021-05-06 07:08:09');
  expect(view.saveButton()!.disabled).toBe(false);
});

it('has no message and no hint in a row of a container, where there is no room', () => {
  const { type, field, queryByText } = setup({ compact: true });
  type('tomorrow');
  expect(queryByText(/Write it as/)).toBeNull();
  expect(field().getAttribute('aria-invalid')).toBe('true');
  expect(field().title).toMatch(/Write it as/);
  expect(queryByText(/Enter saves/)).toBeNull();
});

it('changes the part under the caret with the arrow keys, and selects it', () => {
  const { field, caretAt, press, saveButton } = setup();

  caretAt(15);
  const event = press('ArrowUp');
  expect(event.defaultPrevented).toBe(true);
  expect(field().value).toBe('2020-01-02 03:05:05');
  expect([field().selectionStart, field().selectionEnd]).toEqual([14, 16]);
  expect(saveButton()).not.toBeNull();

  // The part is still selected, so the next key goes on with it
  press('ArrowUp');
  press('ArrowDown');
  press('ArrowDown');
  press('ArrowDown');
  expect(field().value).toBe('2020-01-02 03:03:05');

  caretAt(9);
  press('ArrowDown', { shiftKey: true });
  expect(field().value).toBe('2019-12-23 03:03:05');
  expect([field().selectionStart, field().selectionEnd]).toEqual([8, 10]);
});

it('carries a part into the next, and saves what the keys made', () => {
  const { field, type, caretAt, press, saveButton } = setup();
  type('2020-12-31 23:59:59');
  caretAt(18);
  press('ArrowUp');
  expect(field().value).toBe('2021-01-01 00:00:00');

  saveButton()!.click();
  expect(setState).toHaveBeenLastCalledWith(['when'], marker('2021-01-01T00:00:00'));
});

it('leaves the arrow keys alone when the text is not a date, or with a modifier', () => {
  const { field, type, caretAt, press } = setup();
  type('tomorrow');
  caretAt(3);
  expect(press('ArrowUp').defaultPrevented).toBe(false);
  expect(field().value).toBe('tomorrow');

  type('2020-01-02 03:04:05');
  caretAt(15);
  expect(press('ArrowUp', { ctrlKey: true }).defaultPrevented).toBe(false);
  expect(press('ArrowUp', { altKey: true }).defaultPrevented).toBe(false);
  expect(field().value).toBe('2020-01-02 03:04:05');
});

it('does not change a date that is locked', () => {
  const { field, lockButton, caretAt, press } = setup();
  lockButton()!.click();
  return vi
    .waitFor(() => expect(field().readOnly).toBe(true))
    .then(() => {
      caretAt(15);
      press('ArrowUp');
      expect(field().value).toBe('2020-01-02 03:04:05');
    });
});
