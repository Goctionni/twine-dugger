import type { JSX } from '@solidjs/web';
import { createSignal, Show } from 'solid-js';

import { btnClass } from './btnClass';
import { Dialog } from './Dialog';

interface PromptState {
  dialogTitle: string;
  content: () => JSX.Element;
  reject: () => void;
}

const [prompt, setPrompt] = createSignal<PromptState>();

type PromptResolver<T> = (createResolver: (result: T) => void) => JSX.Element;

export function showPromptDialog<T>(dialogTitle: string, resolver: PromptResolver<T>) {
  return new Promise<T>((resolvePromise, rejectPromise) => {
    const resolve = (result: T) => {
      resolvePromise(result);
      setPrompt(undefined);
    };
    const reject = () => {
      rejectPromise();
      setPrompt(undefined);
    };
    setPrompt({ dialogTitle, content: () => resolver(resolve), reject });
  });
}

export async function showConfirmDialog(
  title: string,
  message: JSX.Element,
  confirmLabel = 'OK',
): Promise<boolean> {
  try {
    return await showPromptDialog<boolean>(title, (answer) => (
      <div class="flex max-w-sm flex-col gap-4 py-2">
        <p class="text-sm">{message}</p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class={btnClass('outline', 'clr-gray')}
            onClick={() => answer(false)}
          >
            Cancel
          </button>
          <button type="button" class={btnClass('contained')} onClick={() => answer(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    ));
  } catch {
    return false;
  }
}

export function PromptDialogOutlet() {
  return (
    <Show when={prompt()}>
      {(current) => (
        <Dialog onClose={current().reject} open closedby="any" heading={current().dialogTitle}>
          {current().content()}
        </Dialog>
      )}
    </Show>
  );
}
