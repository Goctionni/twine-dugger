interface SaveButtonProps {
  onClick: () => void;
  /** There is a change, but it cannot be saved as it is */
  disabled?: boolean;
}

/** Takes the place of the lock button while there is a change to save */
export function SaveButton(props: SaveButtonProps) {
  return (
    <button
      type="button"
      aria-label="Save"
      title={props.disabled ? 'It cannot be saved as it is' : 'Save the change'}
      disabled={props.disabled}
      class="inline-flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-sky-500 bg-sky-700 text-white hover:bg-sky-600 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-sky-700"
      onClick={() => props.onClick()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        save
      </span>
    </button>
  );
}
