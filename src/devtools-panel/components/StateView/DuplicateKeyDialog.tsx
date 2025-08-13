import clsx from 'clsx';
import { createEffect, createSignal, onMount } from 'solid-js';

const inputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

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
      <button
        type="submit"
        class={clsx(
          buttonClasses,
          'text-white px-4 rounded-md bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
        )}
      >
        Confirm
      </button>
    </form>
  );
}
