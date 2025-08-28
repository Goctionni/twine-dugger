import { createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';

interface NavItem {
  text: string;
  icon: string;
}

export const navItems = [
  {
    text: 'State',
    icon: 'data_object',
  },
  {
    text: 'Search',
    icon: 'search',
  },
  {
    text: 'Passages',
    icon: 'content_copy',
  },
  {
    text: 'Settings',
    icon: 'settings',
  },
] as const satisfies NavItem[];

const [store, setStore] = createStore<{ current: NavItem }>({ current: navItems[0] });

const getNavItem = createMemo(() => store.current);
const setNavItem = (item: NavItem) => setStore({ current: item });
const isCurrentNavItem = (item: NavItem) => getNavItem().text === item.text;

export { getNavItem, isCurrentNavItem, setNavItem };
