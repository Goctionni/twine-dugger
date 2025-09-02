import { For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Portal } from 'solid-js/web';

interface ContextMenuItem {
  disabled?: boolean | (() => boolean);
  label: string | (() => string);
  onClick: () => void;
}

interface ContextMenuStore {
  event: MouseEvent | null;
  items: ContextMenuItem[] | null;
}

// Place to set the event and items to show in a context menu
const [contextMenu, setStore] = createStore<ContextMenuStore>({ event: null, items: null });
const clearContextMenu = () => setStore({ event: null, items: null });

// Returns event-handler for onContextMenu
export function createContextMenuHandler(menuItems: ContextMenuItem[]) {
  return (event: MouseEvent) => {
    if (event.ctrlKey) return;
    setStore({ event, items: menuItems });
    event.preventDefault();
    event.stopPropagation();
  };
}

export function ContextMenuUI() {
  return (
    <Show when={contextMenu.event && contextMenu.items?.length}>
      <Portal>
        <div class="fixed inset-0 z-20">
          <div
            class="absolute inset-0 -z-10"
            onClick={() => clearContextMenu()}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            style={{ top: `${contextMenu.event?.y}px`, left: `${contextMenu.event?.x}px` }}
            class="fixed flex flex-col items-stretch bg-gray-800 text-white rounded shadow-lg z-50 p-2"
            onContextMenu={(e) => e.preventDefault()}
          >
            <For each={contextMenu.items}>
              {(item) => (
                <button
                  class="
                  px-4 py-2 hover:bg-gray-600 cursor-pointer text-left
                  disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-default
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
    </Show>
  );
}
