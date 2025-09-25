import clsx from 'clsx';
import { createSignal } from 'solid-js';

import { btnClass } from '@/devtools-panel/ui/util/btnClass';

const inputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

export function DuplicateKeyDialog(props: { onConfirm: (key: string) => void }) {
  const [key, setKey] = createSignal('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    props.onConfirm(key());
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-2">
      <input
        autofocus
        type="text"
        value={key()}
        onInput={(e) => setKey(e.currentTarget.value)}
        class={clsx(inputClasses, 'rounded-md')}
      />
      <button type="submit" class={btnClass('contained')}>
        Confirm
      </button>
    </form>
  );
}
