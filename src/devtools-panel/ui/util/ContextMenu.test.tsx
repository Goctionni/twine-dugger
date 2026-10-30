import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { ContextMenuUI, createContextMenuHandler } from './ContextMenu';

afterEach(cleanup);

function setup(onInner = vi.fn()) {
  render(() => (
    <div
      data-testid="outer"
      onContextMenu={createContextMenuHandler([{ label: 'Outer item', onClick: () => {} }])}
    >
      <div
        data-testid="middle"
        onContextMenu={createContextMenuHandler(
          [{ label: 'Middle item', onClick: () => {} }],
          'middle heading',
        )}
      >
        <button
          type="button"
          data-testid="inner"
          onContextMenu={createContextMenuHandler(() => [
            { label: 'Inner item', onClick: onInner },
          ])}
        />
      </div>
      <ContextMenuUI />
    </div>
  ));
}

const rightClick = (element: HTMLElement, init: MouseEventInit = {}) => {
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  return event;
};

it('shows the items of every element above the one clicked, the innermost first', async () => {
  setup();
  const event = rightClick(screen.getByTestId('inner'));

  await screen.findByText('Inner item');
  const labels = screen.getAllByRole('button').map((button) => button.textContent);
  expect(labels).toEqual(['', 'Inner item', 'Middle item', 'Outer item']);
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByText('middle heading')).toBeTruthy();
  expect(document.querySelectorAll('hr')).toHaveLength(2);
});

it('shows only the items of the elements above where the click was', async () => {
  setup();
  rightClick(screen.getByTestId('middle'));

  await screen.findByText('Middle item');
  expect(screen.getByText('Outer item')).toBeTruthy();
  expect(screen.queryByText('Inner item')).toBeNull();
});

it('runs the item and closes the menu', async () => {
  const onInner = vi.fn();
  setup(onInner);
  rightClick(screen.getByTestId('inner'));

  (await screen.findByText('Inner item')).click();

  expect(onInner).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByText('Inner item')).toBeNull());
});

it('leaves the browser menu to a click with ctrl held', () => {
  setup();
  const event = rightClick(screen.getByTestId('inner'), { ctrlKey: true });

  expect(event.defaultPrevented).toBe(false);
  expect(screen.queryByText('Inner item')).toBeNull();
});

it('leaves the browser menu to an input', () => {
  render(() => (
    <div onContextMenu={createContextMenuHandler([{ label: 'Outer item', onClick: () => {} }])}>
      <input data-testid="field" />
      <ContextMenuUI />
    </div>
  ));
  const event = rightClick(screen.getByTestId('field'));

  expect(event.defaultPrevented).toBe(false);
  expect(screen.queryByText('Outer item')).toBeNull();
});
