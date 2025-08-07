import { Portal } from 'solid-js/web';
import { useContextMenuRegistrations } from './useContextMenu';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { ContextMenuRegistration } from './types';

interface MappepRegistration extends ContextMenuRegistration {
  onAdded: () => void;
  onRemoved: () => void;
}

interface RegistrationClickEvent {
  event: MouseEvent;
  registration: ContextMenuRegistration;
}

export function ContextMenuUI() {
  const [getEvent, setEvent] = createSignal<RegistrationClickEvent | null>(null);

  const registrations = useContextMenuRegistrations();
  const mappedRegistrations = createMemo(() => {
    return new Set<MappepRegistration>(
      registrations.map((registration) => {
        const handler = (event: MouseEvent) => {
          setEvent({ event, registration });
          event.stopPropagation();
          event.preventDefault();
        };
        return {
          ...registration,
          onAdded: () => registration.container?.addEventListener('contextmenu', handler),
          onRemoved: () => registration.container?.removeEventListener('contextmenu', handler),
        };
      }),
    );
  });

  createEffect((prev: Set<MappepRegistration>) => {
    const cur = mappedRegistrations();

    const addedItems = cur.difference(prev);
    const removedItems = prev.difference(cur);

    addedItems.forEach((item) => item.onAdded());
    removedItems.forEach((item) => item.onRemoved());
    return cur;
  }, mappedRegistrations());

  onCleanup(() => {
    mappedRegistrations().forEach((item) => item.onRemoved());
  });

  return (
    <Show when={getEvent()}>
      <Portal>
        <div class="fixed inset-0 z-20">
          <div
            class="absolute inset-0 -z-10"
            onClick={() => setEvent(null)}
            onContextMenu={(e) => e.preventDefault()}
          ></div>
          <div
            style={{ top: `${getEvent()?.event.y}px`, left: `${getEvent()?.event.x}px` }}
            class="fixed bg-gray-800 text-white rounded shadow-lg z-50 p-2"
            onContextMenu={(e) => e.preventDefault()}
          >
            {getEvent()?.registration.items.map((item) => (
              <div
                class="px-4 py-2 hover:bg-gray-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  setEvent(null);
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
