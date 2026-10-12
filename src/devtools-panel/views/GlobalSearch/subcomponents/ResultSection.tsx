import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { createSignal, Show } from 'solid-js';

interface Props {
  title: string;
  /** What is shown, and what was found before the filters */
  shown: number;
  total: number;
  /** Whether the heading can fold the results away (when more than one section is on the page) */
  collapsible: boolean;
  children: JSX.Element;
}

export function ResultSection(props: Props) {
  const [isFolded, setIsFolded] = createSignal(false);
  const collapsed = () => props.collapsible && isFolded();

  return (
    <section class={clsx('flex min-h-0 flex-col', !collapsed() && props.shown > 0 && 'flex-1')}>
      <h3 class="sticky top-0 z-10 border-b border-slate-700 bg-slate-800">
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-1 text-left text-xs font-semibold tracking-wide text-slate-300 uppercase enabled:cursor-pointer enabled:hover:bg-slate-700"
          disabled={!props.collapsible}
          aria-expanded={collapsed() ? 'false' : 'true'}
          onClick={() => setIsFolded((current) => !current)}
        >
          <Show when={props.collapsible}>
            <span aria-hidden="true">{collapsed() ? '▸' : '▾'}</span>
          </Show>
          <span>{props.title}</span>
          <span class="font-normal text-slate-400 normal-case">
            {props.shown === props.total ? props.total : `${props.shown} of ${props.total}`}
          </span>
        </button>
      </h3>
      <Show when={!collapsed()}>
        <Show
          when={props.shown > 0}
          fallback={<p class="px-3 py-2 text-sm text-slate-400">No results</p>}
        >
          <div class="min-h-0 flex-1">{props.children}</div>
        </Show>
      </Show>
    </section>
  );
}
