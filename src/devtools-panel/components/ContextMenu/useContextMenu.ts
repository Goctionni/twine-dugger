import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import { ContextMenuItem, ContextMenuRegistration } from './types';
import { createStore } from 'solid-js/store';

const [store, setStore] = createStore<ContextMenuRegistration[]>([]);

export function useContextMenu(menuItems: ContextMenuItem[]) {
  const [getContainer, setContainer] = createSignal<HTMLElement | undefined>();
  const registration = createMemo(() => ({ container: getContainer(), items: menuItems }));

  createEffect(() => {
    const addItem = registration();
    setStore((prev) => [...prev, addItem]);
    return onCleanup(() => setStore((prev) => prev.filter((item) => item !== addItem)));
  });

  return setContainer;
}

export const useContextMenuRegistrations = () => store;
