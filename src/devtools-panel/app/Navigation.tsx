import clsx from 'clsx';
import { For } from 'solid-js';

import { Page } from '@/shared/shared-types';

import { getNavigationPage, setNavigationPage } from '../store';

interface NavItem {
  id: Page;
  text: string;
  icon: string;
}

const navItems = [
  {
    id: 'state',
    text: 'State',
    icon: 'data_object',
  },
  {
    id: 'search',
    text: 'Search',
    icon: 'search',
  },
  {
    id: 'passages',
    text: 'Passages',
    icon: 'content_copy',
  },
  {
    id: 'settings',
    text: 'Settings',
    icon: 'settings',
  },
] as const satisfies NavItem[];

export function Navigation() {
  const isCurrentNavItem = (item: NavItem) => getNavigationPage() === item.id;
  return (
    <nav>
      <ul class="flex">
        <For each={navItems}>
          {(item) => {
            const active = () => isCurrentNavItem(item);

            return (
              <li>
                <button
                  onClick={() => setNavigationPage(item.id)}
                  class={clsx('navitem', active() && 'active')}
                >
                  <span
                    class="material-symbols-outlined leading-none align-middle translate-y-[3%]"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  <span class="navitem-label">{item.text}</span>
                </button>
              </li>
            );
          }}
        </For>
      </ul>
    </nav>
  );
}
