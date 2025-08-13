import { createEffect, JSX } from 'solid-js';
import { Portal } from 'solid-js/web';

import { CrossIcon } from '../Icons/CrossIcon';

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
          bg-gray-900 text-white px-4 py-2 m-auto
          transition-all [transition-behavior:allow-discrete] duration-300
          backdrop:transition-all
          backdrop:backdrop-blur-none
          backdrop:backdrop-saturate-100
          opacity-0
          -translate-y-1/2
          open:opacity-100
          open:translate-y-0
          open:backdrop:backdrop-blur-xs
          open:backdrop:backdrop-saturate-50
          [@starting-style]:open:opacity-0
          [@starting-style]:open:-translate-y-1/2
          [@starting-style]:open:backdrop:backdrop-blur-none
          [@starting-style]:open:backdrop:backdrop-saturate-100
        "
        on:close={() => props.onClose?.()}
      >
        <header class="mb-1 border-b-2 border-b-gray-400 text-xl font-bold py-1 flex gap-4 justify-between min-w-md">
          <div>{props.heading}</div>
          <button commandfor={id} command="close" aria-label="Close" class="cursor-pointer">
            <CrossIcon class="h-6 w-6 text-white hover:text-sky-400" />
          </button>
        </header>
        {props.children}
      </dialog>
    </Portal>
  );
}
