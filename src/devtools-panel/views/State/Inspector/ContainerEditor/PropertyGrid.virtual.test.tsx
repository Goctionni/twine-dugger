import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { stubVirtualLayout } from '@/testing/stub-virtual-layout';
import { createGame } from '@/testing/test-game';

import { createSelection } from './createSelection';
import { PropertyGrid } from './PropertyGrid';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
}));

// A window of three rows
const VIEWPORT_HEIGHT = 114;
const ITEM_HEIGHT = 38;
let layout: ReturnType<typeof stubVirtualLayout>;
beforeEach(() => {
  layout = stubVirtualLayout({ viewportHeight: VIEWPORT_HEIGHT, itemHeight: ITEM_HEIGHT });
});
afterEach(() => {
  cleanup();
  layout.restore();
});

const KEYS = Array.from({ length: 200 }, (_, index) => `k${String(index).padStart(3, '0')}`);

function setup() {
  const game = createGame({ big: Object.fromEntries(KEYS.map((key, index) => [key, index])) });
  startGameState(game.state());
  flush();

  // How far the list is from the top of what scrolls, as the browser would report it. The rest is
  // the layout of `stubVirtualLayout`, which this replaces
  let listTop = 0;
  const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const scrollTop = this.closest<HTMLElement>('.scroller')?.scrollTop ?? 0;
    if (this.getAttribute('role') === 'list') return { top: listTop - scrollTop } as DOMRect;
    const height = this.hasAttribute('data-index') ? ITEM_HEIGHT : VIEWPORT_HEIGHT;
    return { top: 0, left: 0, width: 400, height } as DOMRect;
  });

  const Grid = () => {
    const selection = createSelection(() => ['big']);
    return <PropertyGrid path={['big']} selection={selection} />;
  };
  const view = render(() => (
    <div class="scroller" style={{ 'overflow-y': 'auto' }}>
      <Grid />
    </div>
  ));
  const scroller = view.container.querySelector<HTMLElement>('.scroller')!;
  const names = () =>
    [...view.container.querySelectorAll('li[aria-posinset] span.truncate')].map(
      (name) => name.textContent,
    );
  const scrollTo = (top: number) => {
    scroller.scrollTop = top;
    scroller.dispatchEvent(new Event('scroll'));
    flush();
  };
  const type = (field: HTMLInputElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  return {
    ...view,
    game,
    names,
    scrollTo,
    type,
    setListTop: (top: number) => (listTop = top),
    restore: () => spy.mockRestore(),
  };
}

it('keeps only the rows near the window in the DOM, in a list as tall as all of them', () => {
  const { names, container, restore } = setup();
  expect(names()[0]).toBe('k000');
  expect(names().length).toBeLessThan(25);
  expect(container.querySelector<HTMLElement>('[role="list"]')!.style.height).toBe(`${200 * 38}px`);
  restore();
});

it('says where a row is among all of them, as the others are not in the DOM', () => {
  const { container, scrollTo, restore } = setup();
  scrollTo(38 * 100);
  const row = [...container.querySelectorAll('li[aria-posinset]')].find((item) =>
    item.textContent?.includes('k100'),
  )!;
  expect(row.getAttribute('aria-posinset')).toBe('101');
  expect(row.getAttribute('aria-setsize')).toBe('200');
  restore();
});

it('keeps a row with text that is not saved when it is scrolled out of the window', () => {
  const { getByRole, scrollTo, names, type, restore } = setup();
  type(getByRole<HTMLInputElement>('spinbutton', { name: 'k001' }), '12');

  scrollTo(38 * 100);
  expect(names()).toContain('k001');
  expect(names()).toContain('k100');
  expect(getByRole<HTMLInputElement>('spinbutton', { name: 'k001' }).value).toBe('12');

  scrollTo(0);
  expect(names()).toContain('k001');
  restore();
});

it('lets go of a row that was typed in once it is saved again', () => {
  const { getByRole, getByText, scrollTo, names, type, restore } = setup();
  type(getByRole<HTMLInputElement>('spinbutton', { name: 'k001' }), '12');
  getByText('Discard').click();
  flush();

  scrollTo(38 * 100);
  expect(names()).not.toContain('k001');
  restore();
});

it('keeps the row that has the focus', () => {
  const { getByRole, scrollTo, names, restore } = setup();
  const field = getByRole<HTMLInputElement>('spinbutton', { name: 'k002' });
  field.focus();
  field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  flush();

  scrollTo(38 * 100);
  expect(names()).toContain('k002');

  field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
  flush();
  expect(names()).not.toContain('k002');
  restore();
});

it('measures how far the list is from the top again when the properties change', () => {
  const { game, names, scrollTo, setListTop, restore } = setup();
  // Something above the list that is as tall as 100 rows, and is scrolled past
  setListTop(38 * 100);
  game.live.big.k_new = 1;
  applyUpdate(game.update());
  flush();
  scrollTo(38 * 100);
  expect(names()).toContain('k000');

  // It is gone: what the scroll area shows at that scroll is the rows that are there now
  setListTop(0);
  game.live.big.k_newer = 1;
  applyUpdate(game.update());
  flush();
  scrollTo(38 * 100 + 1);
  expect(names()).not.toContain('k000');
  expect(names()).toContain('k100');
  restore();
});
