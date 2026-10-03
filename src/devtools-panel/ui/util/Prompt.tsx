import type { JSX } from '@solidjs/web';
import { createSignal, Show } from 'solid-js';

import { Dialog } from './Dialog';

interface PromptState {
  dialogTitle: string;
  content: JSX.Element;
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
    setPrompt({ dialogTitle, content: resolver(resolve), reject });
  });
}

export function PromptDialogOutlet() {
  return (
    <Show when={prompt()}>
      {(current) => (
        <Dialog onClose={current().reject} open closedby="any" heading={current().dialogTitle}>
          {current().content}
        </Dialog>
      )}
    </Show>
  );
}
