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
        // Like a pinned tile in the state-nav concept. `/20` is a color-mix of the amber with transparent
        props.isPinned
          ? 'border-yellow-700 bg-amber-400/12.5 text-amber-400 hover:bg-amber-400/30'
          : 'border-gray-500 text-gray-300 hover:bg-gray-700',
      ]}
      onClick={() => props.onToggle()}
    >
      <span
        aria-hidden="true"
        class={[
          'material-symbols-outlined leading-none',
          props.isPinned ? 'text-sm' : 'text-lg',
          // The font has a fill axis: 0 is the outline, 1 the filled star
          props.isPinned && "[font-variation-settings:'FILL'_1]",
        ]}
      >
        star
      </span>
    </button>
  );
}
