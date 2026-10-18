import clsx from 'clsx';
import { Show, createSignal } from 'solid-js';

import type { Path } from '@/shared/shared-types';

import { InfoTab } from './InfoTab';

type Tab = 'history' | 'info';

// The tab stays when another value is selected, and when the panel is left and visited again
const [getTab, setTab] = createSignal<Tab>('history');

interface Props {
  path: Path;
  onSelect: (path: Path) => void;
}

/**
 * Tabs made of `details` that share a name: the browser opens one and closes the others. The
 * titles are in one row and the open content under them: the `details` take no box of their own, so
 * their `summary` and their content are cells of the grid.
 */
export function ValueTabs(props: Props) {
  const name = `value-tabs-${crypto.randomUUID()}`;

  // One tab is always open: a click, or Enter, on the title of the open one does not close it
  const keepOpen = (event: MouseEvent) => {
    if ((event.currentTarget as HTMLElement).parentElement!.hasAttribute('open')) {
      event.preventDefault();
    }
  };

  const titleClass = (tab: Tab) =>
    clsx(
      'row-start-1 cursor-pointer list-none border-b-2 px-3 py-1.5 text-sm select-none marker:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-400',
      getTab() === tab
        ? 'border-sky-500 text-white'
        : 'border-transparent text-gray-400 hover:text-gray-200',
    );
  const contentClass =
    // The box of a closed tab still covers the whole cell, over the tab that is open
    'details-content:col-span-full details-content:row-start-2 details-content:border-t details-content:border-gray-700 details-content:pt-3 not-open:details-content:pointer-events-none';

  return (
    <div class="grid grid-cols-[auto_auto_1fr]">
      <details
        name={name}
        open={getTab() === 'history'}
        onToggle={(event) => event.currentTarget.open && setTab('history')}
        class={clsx('contents', contentClass)}
      >
        <summary class={clsx(titleClass('history'), 'col-start-1')} onClick={keepOpen}>
          History
        </summary>
        <p class="text-sm text-gray-400">Earlier values are not recorded yet.</p>
      </details>
      <details
        name={name}
        open={getTab() === 'info'}
        onToggle={(event) => event.currentTarget.open && setTab('info')}
        class={clsx('contents', contentClass)}
      >
        <summary class={clsx(titleClass('info'), 'col-start-2')} onClick={keepOpen}>
          Info
        </summary>
        <Show when={getTab() === 'info'}>
          <InfoTab path={props.path} onSelect={props.onSelect} />
        </Show>
      </details>
    </div>
  );
}
