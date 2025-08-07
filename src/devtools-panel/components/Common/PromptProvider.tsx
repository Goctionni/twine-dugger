import { JSXElement, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dialog } from './Dialog';

interface Store {
  prompt?: {
    content: JSXElement;
    reject: () => void;
  };
}

const [store, setStore] = createStore<Store>({});

type PromptResolver<T> = (createResolver: (result: T) => void) => JSXElement;

export function showPromptDialog<T>(resolver: PromptResolver<T>) {
  return new Promise<T>((resolvePromise, rejectPromise) => {
    const resolve = (result: T) => {
      resolvePromise(result);
      setStore({ prompt: undefined });
    };
    const reject = () => {
      rejectPromise();
      setStore({ prompt: undefined });
    };
    setStore({ prompt: { content: resolver(resolve), reject } });
  });
}

export function PromptDialogOutlet() {
  return (
    <Show when={store.prompt}>
      <Dialog onClose={store.prompt!.reject} open closedby="any">
        {store.prompt!.content}
      </Dialog>
    </Show>
  );
}
