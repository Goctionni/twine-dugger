import clsx from 'clsx';
import { For } from 'solid-js';

import { isCurrentNavItem, navItems, setNavItem } from './nav-items';

export function Navigation() {
  return (
    <nav>
      <ul class="flex">
        <For each={navItems}>
          {(item) => {
            const active = () => isCurrentNavItem(item);

            return (
              <li>
                <button
                  onClick={() => setNavItem(item)}
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
