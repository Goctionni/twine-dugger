import { createSignal } from 'solid-js';

export function DuplicateKeyDialog(props: { onConfirm: (key: string) => void }) {
  const [key, setKey] = createSignal('');

  return (
    <div class="flex flex-col gap-2">
      <input
        type="text"
        value={key()}
        onInput={(e) => setKey(e.currentTarget.value)}
        class="p-1 bg-gray-800 text-white"
      />
      <button onClick={() => props.onConfirm(key())} class="bg-blue-600 text-white p-1">
        Confirm
      </button>
    </div>
  );
}
