interface Props {
  isPinned: boolean;
  onToggle: () => void;
}

/** Pinned values are first in their container */
export function PinButton(props: Props) {
  return (
    <button
      type="button"
      aria-label="Pin"
      aria-pressed={props.isPinned ? 'true' : 'false'}
      title={props.isPinned ? 'Unpin this value' : 'Pin this value to the top of its container'}
      class={[
        'inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border',
        props.isPinned
          ? 'border-sky-500 bg-sky-950 text-sky-300'
          : 'border-gray-500 text-gray-300 hover:bg-gray-700',
      ]}
      onClick={() => props.onToggle()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        push_pin
      </span>
    </button>
  );
}
