import type { JSX } from '@solidjs/web';
import { Portal } from '@solidjs/web';
import { createSignal, For, Show } from 'solid-js';

interface ContextMenuItem {
  disabled?: boolean | (() => boolean);
  label: JSX.Element | (() => JSX.Element);
  onClick: () => void;
}

interface ContextMenuState {
  event: MouseEvent;
  items: ContextMenuItem[];
}

// Place to set the event and items to show in a context menu
const [contextMenu, setContextMenu] = createSignal<ContextMenuState | null>(null);
const clearContextMenu = () => setContextMenu(null);

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

// Returns event-handler for onContextMenu
export function createContextMenuHandler(menuItems: ContextMenuItem[]) {
  return (event: MouseEvent) => {
    if (event.ctrlKey) return;
    if (isInput(event.target)) return;
    setContextMenu({ event, items: menuItems });
    event.preventDefault();
    event.stopPropagation();
  };
}

export function ContextMenuUI() {
  return (
    <Show when={contextMenu()?.items.length ? contextMenu() : null}>
      {(menu) => (
        <Portal>
          <div class="fixed inset-0 z-20">
            <div
              class="absolute inset-0 -z-10"
              onClick={() => clearContextMenu()}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div
              style={{ top: `${menu().event.y}px`, left: `${menu().event.x}px` }}
              class="fixed z-50 flex flex-col items-stretch rounded bg-gray-800 p-2 text-white shadow-lg"
              onContextMenu={(e) => e.preventDefault()}
            >
              <For each={menu().items}>
                {(item) => (
                  <button
                    class="
                    cursor-pointer px-4 py-2 text-left hover:bg-gray-600
                    disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent
                  "
                    type="button"
                    disabled={typeof item.disabled === 'function' ? item.disabled() : item.disabled}
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
            </div>
          </div>
        </Portal>
      )}
    </Show>
  );
}
