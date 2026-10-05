import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { createEffect, createSignal, Show } from 'solid-js';

interface Props {
  /** The content of the button that opens it */
  trigger: JSX.Element;
  label: string;
  /** Whether what it holds has something set: the button is marked */
  active?: boolean;
  /** Where it opens, relative to the button */
  side: 'right' | 'below';
  triggerClass?: string;
  children: JSX.Element;
}

/** A button with a panel that closes when something else is clicked or Escape is pressed */
export function Popover(props: Props) {
  const [open, setOpen] = createSignal(false);
  let root: HTMLSpanElement | undefined;

  createEffect(open, (isOpen) => {
    if (!isOpen) return;
    const listeners = new AbortController();
    const { signal } = listeners;
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!root?.contains(event.target as Node)) setOpen(false);
      },
      { signal },
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') setOpen(false);
      },
      { signal },
    );
    return () => listeners.abort();
  });

  return (
    <span class="relative inline-flex" ref={root}>
      <button
        type="button"
        class={clsx(
          'cursor-pointer rounded-sm hover:bg-slate-700',
          props.active && 'text-sky-300',
          open() && 'bg-slate-700',
          props.triggerClass,
        )}
        title={props.label}
        aria-label={props.label}
        aria-expanded={open() ? 'true' : 'false'}
        onClick={() => setOpen((current) => !current)}
      >
        {props.trigger}
      </button>
      <Show when={open()}>
        <div
          class={clsx(
            'absolute z-30 max-h-[70vh] w-60 max-w-[90vw] overflow-auto rounded-md border border-slate-600 bg-slate-800 p-2 shadow-lg',
            props.side === 'right' ? 'top-0 left-full ml-1' : 'top-full left-0 mt-1',
          )}
        >
          {props.children}
        </div>
      </Show>
    </span>
  );
}
