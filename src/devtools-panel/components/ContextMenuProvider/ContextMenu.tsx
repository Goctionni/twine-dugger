import { createContext, useContext, createSignal, JSX, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';

interface ContextMenuItem {
  label: string;
  onClick: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
  open: boolean;
}

type ContextHandler = (e: MouseEvent) => ContextMenuItem[] | null;

const ContextMenuContext = createContext<{
  openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeContextMenu: () => void;
  registerContextHandler: (handler: ContextHandler) => () => void;
}>();

export function ContextMenuProvider(props: { children: JSX.Element }) {
  const [state, setState] = createSignal<ContextMenuState>({
    x: 0,
    y: 0,
    items: [],
    open: false,
  });

  const handlers = new Set<ContextHandler>();

  const openContextMenu = (x: number, y: number, items: ContextMenuItem[]) => {
    setState({ x, y, items, open: true });
  };

  const closeContextMenu = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  const registerContextHandler = (handler: ContextHandler) => {
    handlers.add(handler);
    return () => handlers.delete(handler);
  };

  // Global click to close menu
  createEffect(() => {
    if (state().open) {
      const handleClickOutside = () => closeContextMenu();
      document.addEventListener('click', handleClickOutside);
      onCleanup(() => document.removeEventListener('click', handleClickOutside));
    }
  });

  // Global right-click handler
  createEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      for (const handler of handlers) {
        const items = handler(e);
        if (items && items.length > 0) {
          e.preventDefault();
          openContextMenu(e.clientX, e.clientY, items);
          return;
        }
      }

      // Fallback generic context menu
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, [
          {
            label: 'Reload Twine Dugger',
            onClick: () => {
              window.location.reload();
            },
          },
      ]);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    onCleanup(() => document.removeEventListener('contextmenu', handleContextMenu));
  });

  return (
    <ContextMenuContext.Provider value={{ openContextMenu, closeContextMenu, registerContextHandler }}>
      {props.children}
      <Portal>
        {state().open && (
          <div
            style={{ top: `${state().y}px`, left: `${state().x}px` }}
            class="fixed bg-gray-800 text-white rounded shadow-lg z-50 p-2"
            onContextMenu={(e) => e.preventDefault()}
          >
            {state().items.map((item) => (
              <div
                class="px-4 py-2 hover:bg-gray-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  closeContextMenu();
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </Portal>
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('useContextMenu must be used within ContextMenuProvider');
  return ctx;
}
