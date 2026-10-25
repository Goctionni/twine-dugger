import type { JSX } from '@solidjs/web';
import { Portal } from '@solidjs/web';
import { createSignal, For, onCleanup, Show } from 'solid-js';

export interface ContextMenuItem {
  disabled?: boolean | (() => boolean);
  label: JSX.Element | (() => JSX.Element);
  onClick: () => void;
}

export interface ContextMenuGroup {
  /** Says what the items are about, e.g. the path of a row. A function is called by the open menu */
  heading?: JSX.Element | (() => JSX.Element);
  items: ContextMenuItem[];
}

interface ContextMenuState {
  event: MouseEvent;
  groups: ContextMenuGroup[];
}

// Place to set the event and groups to show in a context menu
const [contextMenu, setContextMenu] = createSignal<ContextMenuState | null>(null);
const clearContextMenu = () => setContextMenu(null);

// The handlers add their group while the event bubbles, the element that was clicked first. The
// menu opens at the window, when every handler had its turn
const collected = new WeakMap<MouseEvent, ContextMenuGroup[]>();

function isInput(el: unknown) {
  if (!(el instanceof HTMLElement)) return false;
  // If its an input, its an input
  if (el.matches(`input, textarea, select`)) return true;

  // if its a label for a radio or checkbox, we also consider it an input
  if (!(el instanceof HTMLLabelElement)) return false;
  // Determine if any radio or checkbox is labelled by this input
  const inputs = [
    ...document.querySelectorAll<HTMLInputElement>('input[type=radio], input[type=checkbox]'),
  ];
  return inputs.some((input) => [...(input.labels ?? [])].includes(el));
}

/**
 * Returns event-handler for onContextMenu. The items add up: right-clicking deep in the page shows
 * the items of every element above it that has a menu, the innermost first.
 * `getItems` is called when the menu opens
 */
export function createContextMenuHandler(
  getItems: ContextMenuItem[] | (() => ContextMenuItem[]),
  heading?: JSX.Element | (() => JSX.Element),
) {
  return (event: MouseEvent) => {
    const items = typeof getItems === 'function' ? getItems() : getItems;
    const group = { heading, items };
    const groups = collected.get(event);
    if (groups) groups.push(group);
    else collected.set(event, [group]);
  };
}

function openContextMenu(event: MouseEvent) {
  if (event.ctrlKey || isInput(event.target)) return;
  const groups = collected.get(event)?.filter((group) => group.items.length > 0);
  if (!groups?.length) return;
  setContextMenu({ event, groups });
  event.preventDefault();
}

export function ContextMenuUI() {
  window.addEventListener('contextmenu', openContextMenu);
  onCleanup(() => {
    window.removeEventListener('contextmenu', openContextMenu);
    clearContextMenu();
  });

  return (
    <Show when={contextMenu()}>
      {(menu) => (
        <Portal>
          <div class="fixed inset-0 z-20">
            <div
              class="absolute inset-0 -z-10"
              onClick={() => clearContextMenu()}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div
              style={{
                // Opens toward the middle of the window, so a menu near an edge stays in view
                ...(menu().event.y < window.innerHeight / 2
                  ? { top: `${menu().event.y}px` }
                  : { bottom: `${window.innerHeight - menu().event.y}px` }),
                ...(menu().event.x < window.innerWidth / 2
                  ? { left: `${menu().event.x}px` }
                  : { right: `${window.innerWidth - menu().event.x}px` }),
              }}
              class="fixed z-50 flex max-w-[calc(100vw-1rem)] flex-col items-stretch rounded bg-gray-800 p-2 text-white shadow-lg"
              onContextMenu={(e) => e.preventDefault()}
            >
              <For each={menu().groups}>
                {(group, index) => (
                  <>
                    <Show when={index() > 0}>
                      <hr class="my-1 border-gray-600" />
                    </Show>
                    <Show when={group.heading}>
                      <div class="truncate px-4 pt-1 pb-1 font-mono text-xs text-gray-400">
                        {typeof group.heading === 'function' ? group.heading() : group.heading}
                      </div>
                    </Show>
                    <For each={group.items}>
                      {(item) => (
                        <button
                          class="
                    cursor-pointer px-4 py-2 text-left hover:bg-gray-600
                    disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent
                  "
                          type="button"
                          disabled={
                            typeof item.disabled === 'function' ? item.disabled() : item.disabled
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            item.onClick();
                            clearContextMenu();
                          }}
                        >
                          {typeof item.label === 'function' ? item.label() : item.label}
                        </button>
                      )}
                    </For>
                  </>
                )}
              </For>
            </div>
          </div>
        </Portal>
      )}
    </Show>
  );
}
