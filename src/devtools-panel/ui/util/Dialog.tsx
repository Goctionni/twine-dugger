import type { JSX } from 'solid-js';
import { createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';

import { TooltipOutlet } from '../display/TooltipOutlet';

interface Props {
  onClose?: () => void;
  open?: boolean;
  closedby?: 'any' | 'closerequest' | 'none';
  children: JSX.Element;
  heading?: JSX.Element;
}

export function Dialog(props: Props) {
  const id = `dialog-${Math.random().toString(36)}`;
  let dialog!: HTMLDialogElement;

  createEffect(() => {
    if (props.open) dialog.showModal();
    else dialog.close();
  });

  return (
    <Portal>
      <dialog
        id={id}
        ref={dialog}
        closedby={props.closedby || 'any'}
        class="
          pointer-events-none
          fixed
          top-0
          left-0 m-0
          flex h-full w-full
          items-center justify-center
          bg-transparent
          p-0 opacity-0 
          backdrop:backdrop-blur-none backdrop:backdrop-saturate-100 backdrop:transition-all
          open:opacity-100 open:backdrop:backdrop-blur-xs open:backdrop:backdrop-saturate-50
          starting:open:opacity-0 starting:open:backdrop:backdrop-blur-none starting:open:backdrop:backdrop-saturate-100
        "
        on:close={() => props.onClose?.()}
      >
        <div
          class="pointer-events-auto absolute m-auto bg-gray-900 px-4 py-2 
          text-white transition-all transition-discrete duration-300"
        >
          <header class="mb-1 flex min-w-md justify-between gap-4 border-b-2 border-b-gray-400 py-1 text-xl font-bold">
            <div>{props.heading}</div>
            <button commandfor={id} command="close" aria-label="Close" class="cursor-pointer">
              <span class="material-symbols-outlined text-white">close</span>
            </button>
          </header>
          {props.children}
        </div>
        <TooltipOutlet />
      </dialog>
    </Portal>
  );
}
